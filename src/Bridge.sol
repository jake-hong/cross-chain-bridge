// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Bridge
 * @dev Cross-chain bridge contract for locking and unlocking tokens
 */
contract Bridge {
    // ============ State Variables ============

    // 검증자(Validator) 관리
    mapping(address => bool) public validators; // 주소가 검증자인지 확인
    uint256 public validatorCount; // 총 검증자 수
    uint256 public requiredSignatures; // 필요한 최소 서명 수

    // 트랜잭션 관리
    mapping(bytes32 => bool) public processedTransactions; // 이미 처리된 트랜잭션
    mapping(address => uint256) public nonces; // 각 사용자의 nonce (재사용 방지)

    // 체인 정보
    uint256 public chainId; // 현재 체인 ID (Ethereum=1, Polygon=137 등)

    // 관리자
    address public owner;

    // 상수
    uint256 public constant MIN_VALIDATORS = 1;
    uint256 public constant MAX_VALIDATORS = 20;

    // ============ Constructor ============

    constructor(uint256 _chainId, uint256 _requiredSignatures) {
        chainId = _chainId;
        requiredSignatures = _requiredSignatures;
        owner = msg.sender;
    }
}
