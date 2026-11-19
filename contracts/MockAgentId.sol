// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Test-only mock of the Agent ID registry (balanceOf semantics only).
/// Used on Hardhat/local and testnet deployments where the real registry is not the gate.
/// NEVER used on mainnet — mainnet uses 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F.
contract MockAgentId {
    mapping(address => uint256) private _balances;

    function mint(address to) external {
        _balances[to] = 1;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }
}
