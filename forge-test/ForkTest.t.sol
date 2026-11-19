// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../contracts/SowcialFarm.sol";

interface Vm {
    function createSelectFork(string calldata url) external returns (uint256);
    function prank(address msgSender) external;
    function deal(address account, uint256 newBalance) external;
    function warp(uint256 newTimestamp) external;
}

contract ForkTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant REGISTRY = 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F;
    address constant SYXA = 0x70Bf4A377F74400b06AbADDF7662b21300A7CBC5; // syxa.ai

    function testFork_SyxaCanPlayAgainstRealRegistry() public {
        vm.createSelectFork("https://bsc-rpc.publicnode.com");
        SowcialFarm farm = new SowcialFarm(REGISTRY);
        require(farm.isAgentIdHolder(SYXA), "syxa should be an Agent ID holder on the real registry");

        vm.deal(SYXA, 1 ether);
        vm.prank(SYXA);
        farm.claimLand();
        require(farm.farmerCount() == 1, "farmerCount should be 1");

        vm.prank(SYXA);
        farm.plant(0, 0);
        vm.prank(SYXA);
        farm.water(0);
        vm.warp(block.timestamp + 601);
        vm.prank(SYXA);
        farm.harvest(0);

        (bool claimed, uint256 dewpoints, uint256 totalHarvests, uint256 totalProduce, , ) = farm.farms(SYXA);
        require(claimed, "farm should be claimed");
        require(dewpoints == 15, "dewpoints should be 15 (10 x 1.5 watered, in season)");
        require(totalHarvests == 1, "one harvest");
        require(totalProduce == 3, "3 produce");
    }
}
