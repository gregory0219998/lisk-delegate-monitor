var express		= require ('express');
var request     = require ('request');
var log			= require ('./log');
var config      = require ('./config.json');

var delegateList = [];
var stats = {
	delegates: 0,
	mined: 0,
	shift: 0
};
var balances = {};

exports.update = function () {
	log.debug ('Data', 'Updating data...');
	request('http://' + config.node + '/api/delegates/?limit=101&offset=0&orderBy=rate:asc', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var data = JSON.parse(body);

			var delegateList2 = [];
			var stats2 = { delegates: 0, mined: 0, shift: 0 };

	   		for (var i = 0; i < data.delegates.length; i++) {
				if (config.lobby.indexOf (data.delegates[i].username) != -1) {
					stats2.delegates += 1;
					stats2.mined += data.delegates[i].producedblocks;
					delegateList2.push (data.delegates[i]);
				}
			}

			for (var d in balances) {
				stats2.shift += Math.floor (balances[d]);
			}

			delegateList = delegateList2;
			stats = stats2;

			log.debug ('Data', 'Data updated.');
		}
	});
};

exports.updateBalances = function () {
	log.debug ('Data', 'Updating balance data...');
	for (var i = 0; i < delegateList.length; i++) {
		request ('http://' + config.node + '/api/accounts?address=' + delegateList[i].address, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var data = JSON.parse(body);
				balances [data.account.address] = data.account.balance / 100000000;
			}
		});
	}
};


/** Routes */
var router 		= express.Router();

var checkLogin = function (req, res, next) {
	next ();
};

router.get('/', checkLogin, function (req, res) {
	res.render ('index', { delegates: delegateList, stats: stats, balances: balances });
});



exports.router = router;