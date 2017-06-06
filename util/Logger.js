
module.exports = (...classifier) => {
	const def = classifier.join(' - ')
	const module = {};

	module.log = (...msg) => {
		console.log(`[${def}]`, ...msg);
	};

	module.debug = (...msg) => {
		console.log(`---> [${def}]`, ...msg);
	};

	module.error = (...msg) => {
		console.error(`[${def}]`, ...msg);
	};

	return module;
};
