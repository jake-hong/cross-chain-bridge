// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Bridge.sol";
import "../src/MockERC20.sol";
import "../src/WrappedToken.sol";

contract BridgeIntegrationTest is Test {
    Bridge public ethereumBridge;
    Bridge public polygonBridge;
    MockERC20 public mockToken;
    WrappedToken public wrappedToken;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    uint256 public validator1Key = 0x1;
    uint256 public validator2Key = 0x2;
    uint256 public validator3Key = 0x3;

    address public validator1;
    address public validator2;
    address public validator3;

    uint256 public constant TRANSFER_AMOUNT = 1000 * 10**18;

    function setUp() public {
        // Derive validator addresses from private keys
        validator1 = vm.addr(validator1Key);
        validator2 = vm.addr(validator2Key);
        validator3 = vm.addr(validator3Key);

        // Deploy mock token on Ethereum
        mockToken = new MockERC20("Mock USDC", "mUSDC");

        // Deploy Ethereum bridge (origin chain)
        ethereumBridge = new Bridge(1337, 2, true);

        // Deploy Polygon bridge (destination chain)
        polygonBridge = new Bridge(1338, 2, false);

        // Deploy wrapped token on Polygon
        wrappedToken = new WrappedToken(
            "Wrapped Mock USDC",
            "wmUSDC",
            18,
            address(polygonBridge)
        );

        // Set wrapped token mapping
        polygonBridge.setWrappedToken(address(mockToken), address(wrappedToken));

        // Add validators to both bridges
        ethereumBridge.addValidator(validator1);
        ethereumBridge.addValidator(validator2);
        ethereumBridge.addValidator(validator3);

        polygonBridge.addValidator(validator1);
        polygonBridge.addValidator(validator2);
        polygonBridge.addValidator(validator3);

        // Give tokens to user1
        mockToken.transfer(user1, TRANSFER_AMOUNT * 10);
    }

    function testFullBridgeFlow_EthereumToPolygon() public {
        // Step 1: User locks tokens on Ethereum
        vm.startPrank(user1);
        mockToken.approve(address(ethereumBridge), TRANSFER_AMOUNT);

        uint256 userBalanceBefore = mockToken.balanceOf(user1);

        ethereumBridge.lockTokens(
            address(mockToken),
            TRANSFER_AMOUNT,
            1338, // Polygon chain ID
            user2  // Destination address on Polygon
        );

        assertEq(mockToken.balanceOf(user1), userBalanceBefore - TRANSFER_AMOUNT);
        assertEq(ethereumBridge.getLockedBalance(address(mockToken)), TRANSFER_AMOUNT);
        vm.stopPrank();

        // Step 2: Validators create signatures for unlock
        bytes32 transactionId = keccak256(abi.encodePacked("tx1"));
        bytes32 message = keccak256(abi.encodePacked(
            address(mockToken),
            user2,
            TRANSFER_AMOUNT,
            transactionId,
            uint256(1338) // Polygon chain ID
        ));

        bytes32 ethSignedMessage = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            message
        ));

        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(validator1Key, ethSignedMessage);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(validator2Key, ethSignedMessage);

        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(r1, s1, v1);
        signatures[1] = abi.encodePacked(r2, s2, v2);

        // Step 3: Unlock/mint tokens on Polygon
        polygonBridge.unlockTokens(
            address(mockToken),
            user2,
            TRANSFER_AMOUNT,
            transactionId,
            signatures
        );

        // Verify user2 received wrapped tokens on Polygon
        assertEq(wrappedToken.balanceOf(user2), TRANSFER_AMOUNT);
    }

    function testFullBridgeFlow_PolygonToEthereum() public {
        // First, give user2 some wrapped tokens
        vm.prank(address(polygonBridge));
        wrappedToken.mint(user2, TRANSFER_AMOUNT);

        // Step 1: User burns wrapped tokens on Polygon
        vm.startPrank(user2);

        uint256 wrappedBalanceBefore = wrappedToken.balanceOf(user2);

        wrappedToken.burnAndBridge(
            TRANSFER_AMOUNT,
            1337, // Ethereum chain ID
            user1, // Destination address on Ethereum
            address(mockToken)
        );

        assertEq(wrappedToken.balanceOf(user2), wrappedBalanceBefore - TRANSFER_AMOUNT);
        vm.stopPrank();

        // Step 2: First lock some tokens on Ethereum to have balance
        vm.startPrank(user1);
        mockToken.approve(address(ethereumBridge), TRANSFER_AMOUNT);
        ethereumBridge.lockTokens(
            address(mockToken),
            TRANSFER_AMOUNT,
            1338,
            address(0x999)
        );
        vm.stopPrank();

        // Step 3: Validators create signatures for unlock on Ethereum
        bytes32 transactionId = keccak256(abi.encodePacked("tx2"));
        bytes32 message = keccak256(abi.encodePacked(
            address(mockToken),
            user1,
            TRANSFER_AMOUNT,
            transactionId,
            uint256(1337) // Ethereum chain ID
        ));

        bytes32 ethSignedMessage = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            message
        ));

        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(validator1Key, ethSignedMessage);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(validator2Key, ethSignedMessage);

        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(r1, s1, v1);
        signatures[1] = abi.encodePacked(r2, s2, v2);

        // Step 4: Unlock tokens on Ethereum
        uint256 user1BalanceBefore = mockToken.balanceOf(user1);

        ethereumBridge.unlockTokens(
            address(mockToken),
            user1,
            TRANSFER_AMOUNT,
            transactionId,
            signatures
        );

        // Verify user1 received tokens back on Ethereum
        assertEq(mockToken.balanceOf(user1), user1BalanceBefore + TRANSFER_AMOUNT);
        assertEq(ethereumBridge.getLockedBalance(address(mockToken)), 0);
    }

    function testSignatureValidation() public {
        bytes32 transactionId = keccak256(abi.encodePacked("tx3"));
        bytes32 message = keccak256(abi.encodePacked(
            address(mockToken),
            user2,
            TRANSFER_AMOUNT,
            transactionId,
            uint256(1338)
        ));

        bytes32 ethSignedMessage = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            message
        ));

        // Create valid signatures
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(validator1Key, ethSignedMessage);
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(validator2Key, ethSignedMessage);

        bytes[] memory signatures = new bytes[](2);
        signatures[0] = abi.encodePacked(r1, s1, v1);
        signatures[1] = abi.encodePacked(r2, s2, v2);

        // Should work with valid signatures
        polygonBridge.unlockTokens(
            address(mockToken),
            user2,
            TRANSFER_AMOUNT,
            transactionId,
            signatures
        );

        // Should fail if trying to use same transaction ID again
        vm.expectRevert("Transaction already processed");
        polygonBridge.unlockTokens(
            address(mockToken),
            user2,
            TRANSFER_AMOUNT,
            transactionId,
            signatures
        );
    }

    function testInsufficientSignatures() public {
        bytes32 transactionId = keccak256(abi.encodePacked("tx4"));
        bytes32 message = keccak256(abi.encodePacked(
            address(mockToken),
            user2,
            TRANSFER_AMOUNT,
            transactionId,
            uint256(1338)
        ));

        bytes32 ethSignedMessage = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            message
        ));

        // Create only one signature (insufficient)
        (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(validator1Key, ethSignedMessage);

        bytes[] memory signatures = new bytes[](1);
        signatures[0] = abi.encodePacked(r1, s1, v1);

        // Should fail with insufficient signatures
        vm.expectRevert("Insufficient signatures");
        polygonBridge.unlockTokens(
            address(mockToken),
            user2,
            TRANSFER_AMOUNT,
            transactionId,
            signatures
        );
    }
}