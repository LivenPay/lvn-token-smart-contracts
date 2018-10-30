module.exports = {
	// dir: './',
	// copyNodeModules: true,
	port: 8555,
    norpc: true,
    skipFiles: ['lib/SafeMath.sol', 
    			'lib/Ownable.sol', 
    			'lib/Generic223Receiver.sol', 
    			'lib/ERC20.sol', 
    			'lib/ERC223.sol', ],
};
