// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/WrappedToken.sol";
import "../src/Bridge.sol";

contract WrappedTokenTest is Test {
    WrappedToken public wrappedToken;
    Bridge public bridge;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    uint256 public constant MINT_AMOUNT = 1000 * 10**18;

    function setUp() public {
        // Deploy bridge first
        bridge = new Bridge(1338, 2, false);

        // Deploy wrapped token
        wrappedToken = new WrappedToken(
            "Wrapped Mock USDC",
            "wmUSDC",
            18,
            address(bridge)
        );
    }

    function testInitialState() public {
        assertEq(wrappedToken.name(), "Wrapped Mock USDC");
        assertEq(wrappedToken.symbol(), "wmUSDC");
        assertEq(wrappedToken.decimals(), 18);
        assertEq(wrappedToken.bridge(), address(bridge));
        assertEq(wrappedToken.totalSupply(), 0);
    }

    function testMintFromBridge() public {
        vm.startPrank(address(bridge));

        // Mint tokens
        wrappedToken.mint(user1, MINT_AMOUNT);

        // Check balance and total supply
        assertEq(wrappedToken.balanceOf(user1), MINT_AMOUNT);
        assertEq(wrappedToken.totalSupply(), MINT_AMOUNT);

        vm.stopPrank();
    }

    function testMintRevertsFromNonBridge() public {
        vm.startPrank(user1);

        vm.expectRevert("Only bridge can call this function");
        wrappedToken.mint(user1, MINT_AMOUNT);

        vm.stopPrank();
    }

    function testBurnFromBridge() public {
        // First mint some tokens
        vm.startPrank(address(bridge));
        wrappedToken.mint(user1, MINT_AMOUNT);
        vm.stopPrank();

        // Then burn them
        vm.startPrank(address(bridge));
        wrappedToken.burn(user1, MINT_AMOUNT / 2);

        assertEq(wrappedToken.balanceOf(user1), MINT_AMOUNT / 2);
        assertEq(wrappedToken.totalSupply(), MINT_AMOUNT / 2);

        vm.stopPrank();
    }

    function testBurnRevertsFromNonBridge() public {
        // First mint some tokens
        vm.startPrank(address(bridge));
        wrappedToken.mint(user1, MINT_AMOUNT);
        vm.stopPrank();

        vm.startPrank(user1);

        vm.expectRevert("Only bridge can call this function");
        wrappedToken.burn(user1, MINT_AMOUNT);

        vm.stopPrank();
    }

    function testBurnAndBridge() public {
        // Set up wrapped token mapping first
        address originalToken = address(0x123);
        bridge.setWrappedToken(originalToken, address(wrappedToken));

        // First mint some tokens
        vm.startPrank(address(bridge));
        wrappedToken.mint(user1, MINT_AMOUNT);
        vm.stopPrank();

        // User burns tokens to bridge back
        vm.startPrank(user1);

        uint256 balanceBefore = wrappedToken.balanceOf(user1);
        uint256 totalSupplyBefore = wrappedToken.totalSupply();

        wrappedToken.burnAndBridge(
            MINT_AMOUNT / 2,
            1337, // destination chain
            user2, // destination address
            originalToken
        );

        assertEq(wrappedToken.balanceOf(user1), balanceBefore - MINT_AMOUNT / 2);
        assertEq(wrappedToken.totalSupply(), totalSupplyBefore - MINT_AMOUNT / 2);

        vm.stopPrank();
    }

    function testBurnAndBridgeRevertsOnZeroAmount() public {
        vm.startPrank(user1);

        vm.expectRevert("Amount must be greater than 0");
        wrappedToken.burnAndBridge(0, 1337, user2, address(0x123));

        vm.stopPrank();
    }

    function testBurnAndBridgeRevertsOnInsufficientBalance() public {
        vm.startPrank(user1);

        vm.expectRevert();
        wrappedToken.burnAndBridge(MINT_AMOUNT, 1337, user2, address(0x123));

        vm.stopPrank();
    }

    function testTransfer() public {
        // First mint some tokens
        vm.startPrank(address(bridge));
        wrappedToken.mint(user1, MINT_AMOUNT);
        vm.stopPrank();

        // Transfer tokens
        vm.startPrank(user1);
        wrappedToken.transfer(user2, MINT_AMOUNT / 2);

        assertEq(wrappedToken.balanceOf(user1), MINT_AMOUNT / 2);
        assertEq(wrappedToken.balanceOf(user2), MINT_AMOUNT / 2);

        vm.stopPrank();
    }

    function testApproveAndTransferFrom() public {
        // First mint some tokens
        vm.startPrank(address(bridge));
        wrappedToken.mint(user1, MINT_AMOUNT);
        vm.stopPrank();

        // Approve and transfer
        vm.startPrank(user1);
        wrappedToken.approve(user2, MINT_AMOUNT / 2);
        vm.stopPrank();

        vm.startPrank(user2);
        wrappedToken.transferFrom(user1, user2, MINT_AMOUNT / 2);

        assertEq(wrappedToken.balanceOf(user1), MINT_AMOUNT / 2);
        assertEq(wrappedToken.balanceOf(user2), MINT_AMOUNT / 2);

        vm.stopPrank();
    }
}