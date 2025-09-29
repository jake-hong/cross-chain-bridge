// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Bridge.sol";
import "../src/WrappedToken.sol";
import "../src/MockERC20.sol";

contract DeployScript is Script {
    // Deployed contract addresses
    Bridge public ethereumBridge;
    Bridge public polygonBridge;
    MockERC20 public mockToken;
    WrappedToken public wrappedToken;

    // Test accounts from Ganache
    address constant DEPLOYER = 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1;
    address constant VALIDATOR1 = 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0;
    address constant VALIDATOR2 = 0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b;
    address constant VALIDATOR3 = 0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d;

    function run() external {
        // Get private key from environment or use default test key
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d));

        // Get chain ID to determine deployment target
        uint256 chainId = block.chainid;

        vm.startBroadcast(deployerPrivateKey);

        if (chainId == 1337) {
            // Deploy to Ethereum local network
            console.log("========================================");
            console.log("Deploying to Ethereum Local Network");
            console.log("========================================");

            // Deploy mock token on Ethereum
            mockToken = new MockERC20("Mock USDC", "mUSDC");
            console.log("MockERC20 deployed at:", address(mockToken));

            // Deploy Bridge on Ethereum (origin chain)
            ethereumBridge = new Bridge(1337, 2, true);
            console.log("Ethereum Bridge deployed at:", address(ethereumBridge));

            // Add validators
            ethereumBridge.addValidator(VALIDATOR1);
            ethereumBridge.addValidator(VALIDATOR2);
            ethereumBridge.addValidator(VALIDATOR3);
            console.log("Validators added to Ethereum Bridge");

        } else if (chainId == 1338) {
            // Deploy to Polygon local network
            console.log("========================================");
            console.log("Deploying to Polygon Local Network");
            console.log("========================================");

            // Deploy Bridge on Polygon (destination chain)
            polygonBridge = new Bridge(1338, 2, false);
            console.log("Polygon Bridge deployed at:", address(polygonBridge));

            // Deploy WrappedToken on Polygon
            wrappedToken = new WrappedToken(
                "Wrapped Mock USDC",
                "wmUSDC",
                18,
                address(polygonBridge)
            );
            console.log("WrappedToken deployed at:", address(wrappedToken));

            // Set wrapped token mapping (use a placeholder address for now)
            address mockTokenAddress = 0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab; // From Ethereum deployment
            polygonBridge.setWrappedToken(mockTokenAddress, address(wrappedToken));
            console.log("Wrapped token mapping set");

            // Add validators
            polygonBridge.addValidator(VALIDATOR1);
            polygonBridge.addValidator(VALIDATOR2);
            polygonBridge.addValidator(VALIDATOR3);
            console.log("Validators added to Polygon Bridge");
        }

        vm.stopBroadcast();

        // Print summary
        console.log("\n========================================");
        console.log("Deployment Summary");
        console.log("========================================");

        if (chainId == 1337) {
            console.log("Ethereum Network (Chain ID: 1337)");
            console.log("  MockERC20:", address(mockToken));
            console.log("  Bridge:", address(ethereumBridge));
        } else if (chainId == 1338) {
            console.log("Polygon Network (Chain ID: 1338)");
            console.log("  Bridge:", address(polygonBridge));
            console.log("  WrappedToken:", address(wrappedToken));
        }

        console.log("\nValidators:");
        console.log("  Validator 1:", VALIDATOR1);
        console.log("  Validator 2:", VALIDATOR2);
        console.log("  Validator 3:", VALIDATOR3);
        console.log("  Required Signatures: 2/3");
        console.log("========================================");
    }
}