// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Bridge.sol";
import "../src/MockERC20.sol";
import "../src/WrappedToken.sol";

contract BridgeTest is Test {
    Bridge public ethereumBridge;
    Bridge public polygonBridge;
    MockERC20 public mockToken;
    WrappedToken public wrappedToken;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public validator1 = address(0x3);
    address public validator2 = address(0x4);
    address public validator3 = address(0x5);

    uint256 public constant TRANSFER_AMOUNT = 1000 * 10**18;

    function setUp() public {
        // Deploy mock token
        mockToken = new MockERC20("Mock USDC", "mUSDC");

        // Deploy Ethereum bridge (origin chain)
        ethereumBridge = new Bridge(1337, 2, true);

        // Deploy Polygon bridge (destination chain)
        polygonBridge = new Bridge(1338, 2, false);

        // Deploy wrapped token
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

    function testLockTokens() public {
        vm.startPrank(user1);

        // Approve bridge to spend tokens
        mockToken.approve(address(ethereumBridge), TRANSFER_AMOUNT);

        // Get initial balances
        uint256 userBalanceBefore = mockToken.balanceOf(user1);
        uint256 bridgeBalanceBefore = ethereumBridge.getLockedBalance(address(mockToken));

        // Lock tokens
        ethereumBridge.lockTokens(
            address(mockToken),
            TRANSFER_AMOUNT,
            1338, // destination chain
            user2  // destination address
        );

        // Check balances after lock
        uint256 userBalanceAfter = mockToken.balanceOf(user1);
        uint256 bridgeBalanceAfter = ethereumBridge.getLockedBalance(address(mockToken));

        assertEq(userBalanceAfter, userBalanceBefore - TRANSFER_AMOUNT);
        assertEq(bridgeBalanceAfter, bridgeBalanceBefore + TRANSFER_AMOUNT);

        vm.stopPrank();
    }

    function testLockTokensRevertsOnZeroAmount() public {
        vm.startPrank(user1);

        mockToken.approve(address(ethereumBridge), TRANSFER_AMOUNT);

        vm.expectRevert("Amount must be greater than 0");
        ethereumBridge.lockTokens(
            address(mockToken),
            0,
            1338,
            user2
        );

        vm.stopPrank();
    }

    function testLockTokensRevertsOnSameChain() public {
        vm.startPrank(user1);

        mockToken.approve(address(ethereumBridge), TRANSFER_AMOUNT);

        vm.expectRevert("Cannot bridge to same chain");
        ethereumBridge.lockTokens(
            address(mockToken),
            TRANSFER_AMOUNT,
            1337, // same chain
            user2
        );

        vm.stopPrank();
    }

    function testLockTokensRevertsOnDestinationChain() public {
        vm.startPrank(user1);

        // Try to lock on destination chain (should fail)
        vm.expectRevert("Only available on origin chain");
        polygonBridge.lockTokens(
            address(mockToken),
            TRANSFER_AMOUNT,
            1337,
            user2
        );

        vm.stopPrank();
    }

    function testAddValidator() public {
        address newValidator = address(0x6);

        // Add validator
        ethereumBridge.addValidator(newValidator);

        // Check validator was added
        assertTrue(ethereumBridge.validators(newValidator));
        assertEq(ethereumBridge.validatorCount(), 4);
    }

    function testAddValidatorRevertsOnInvalidAddress() public {
        vm.expectRevert("Invalid validator address");
        ethereumBridge.addValidator(address(0));
    }

    function testAddValidatorRevertsOnDuplicate() public {
        vm.expectRevert("Validator already exists");
        ethereumBridge.addValidator(validator1);
    }

    function testRemoveValidator() public {
        // Remove validator
        ethereumBridge.removeValidator(validator1);

        // Check validator was removed
        assertFalse(ethereumBridge.validators(validator1));
        assertEq(ethereumBridge.validatorCount(), 2);
    }

    function testRemoveValidatorRevertsOnNonExistent() public {
        vm.expectRevert("Validator does not exist");
        ethereumBridge.removeValidator(address(0x6));
    }

    function testRemoveValidatorRevertsWhenBreaksRequiredSignatures() public {
        // Set required signatures to 3
        ethereumBridge.setRequiredSignatures(3);

        // Try to remove a validator (would break required signatures)
        vm.expectRevert("Would break required signatures");
        ethereumBridge.removeValidator(validator1);
    }

    function testSetRequiredSignatures() public {
        ethereumBridge.setRequiredSignatures(3);
        assertEq(ethereumBridge.requiredSignatures(), 3);
    }

    function testSetRequiredSignaturesRevertsOnZero() public {
        vm.expectRevert("Required signatures must be > 0");
        ethereumBridge.setRequiredSignatures(0);
    }

    function testSetRequiredSignaturesRevertsOnTooHigh() public {
        vm.expectRevert("Required signatures too high");
        ethereumBridge.setRequiredSignatures(4);
    }
}