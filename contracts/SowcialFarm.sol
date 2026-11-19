// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Minimal interface for the Binance Agent ID registry (SPACE ID Agent ID, ERC-721).
/// Registry on BNB Chain mainnet: 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
interface IAgentIdRegistry {
    function balanceOf(address owner) external view returns (uint256);
}

/// @title SowcialFarm
/// @notice Sowcial — the social farming game where every farmer is an Agent ID.
/// @dev Design rules for the Agent ID Hackathon:
/// - Agent ID is the core identity: every gameplay action requires holding an Agent ID.
/// - One Agent ID address = one farm (Agent IDs are non-transferable, 1 per person).
/// - The contract NEVER custodies user funds. There is no token, nothing to buy or sell,
///   and no promise of returns. Score is "Dewpoints": non-transferable points stored here.
/// - Owner powers are limited to pause/unpause (documented in README). No mint, no tax,
///   no withdrawal function exists.
contract SowcialFarm is Ownable, Pausable, ReentrancyGuard {
    uint8 public constant PLOT_COUNT = 9; // 3x3 farm grid
    uint8 public constant CROP_COUNT = 3;
    uint256 public constant SEASON_DURATION = 3 days;
    uint256 public constant HELP_COOLDOWN = 1 days;
    uint256 public constant HELP_POINTS_HELPER = 3;
    uint256 public constant HELP_POINTS_FARMER = 2;

    IAgentIdRegistry public immutable agentIdRegistry;
    uint256 public immutable seasonStart;

    struct Crop {
        string name;
        uint256 growTime; // seconds until harvestable
        uint256 basePoints; // Dewpoints at harvest, before modifiers
        uint8 season; // 0 Spring, 1 Summer, 2 Autumn, 3 Winter
        uint256 yieldUnits; // produce units counted at harvest (in-season)
    }

    struct Plot {
        bool active;
        uint8 cropId;
        uint64 plantedAt;
        uint64 readyAt;
        bool watered;
    }

    struct Farm {
        bool claimed;
        uint256 dewpoints;
        uint256 totalHarvests;
        uint256 totalProduce;
        uint256 timesHelped; // how often this farmer helped a neighbor
        uint256 timesHelpedBy; // how often neighbors helped this farmer
    }

    Crop[CROP_COUNT] public crops;
    mapping(address => Farm) public farms;
    mapping(address => Plot[PLOT_COUNT]) private _plots;
    mapping(address => mapping(address => uint256)) public lastHelpAt; // helper => farmer => timestamp
    address[] public farmerList;

    event LandClaimed(address indexed farmer);
    event Planted(address indexed farmer, uint8 indexed plot, uint8 cropId, uint64 readyAt);
    event Watered(address indexed farmer, uint8 indexed plot);
    event Harvested(
        address indexed farmer,
        uint8 indexed plot,
        uint8 cropId,
        uint256 pointsEarned,
        uint256 produceUnits,
        bool inSeason
    );
    event NeighborHelped(address indexed helper, address indexed farmer, uint256 helperPoints, uint256 farmerPoints);

    error NotAgentIdHolder();
    error AlreadyClaimed();
    error NoFarm();
    error InvalidPlot();
    error InvalidCrop();
    error PlotOccupied();
    error PlotEmpty();
    error AlreadyWatered();
    error NotReady(uint64 readyAt);
    error CannotHelpSelf();
    error HelpOnCooldown(uint256 availableAt);

    modifier onlyAgentIdHolder() {
        if (agentIdRegistry.balanceOf(msg.sender) == 0) revert NotAgentIdHolder();
        _;
    }

    modifier hasFarm() {
        if (!farms[msg.sender].claimed) revert NoFarm();
        _;
    }

    constructor(address registry) Ownable(msg.sender) {
        require(registry != address(0), "registry is zero address");
        agentIdRegistry = IAgentIdRegistry(registry);
        seasonStart = block.timestamp;

        // Demo-friendly grow times so a full loop is playable in minutes/hours, not days.
        crops[0] = Crop("Turnip", 10 minutes, 10, 0, 3); // Spring
        crops[1] = Crop("Star Melon", 1 hours, 35, 1, 4); // Summer
        crops[2] = Crop("Pumpkin", 6 hours, 120, 2, 6); // Autumn
    }

    // ---------- Views ----------

    function isAgentIdHolder(address account) external view returns (bool) {
        return agentIdRegistry.balanceOf(account) > 0;
    }

    /// @notice Current season: 0 Spring, 1 Summer, 2 Autumn, 3 Winter. Rotates every SEASON_DURATION.
    function currentSeason() public view returns (uint8) {
        return uint8(((block.timestamp - seasonStart) / SEASON_DURATION) % 4);
    }

    function farmerCount() external view returns (uint256) {
        return farmerList.length;
    }

    function getFarmers(uint256 offset, uint256 limit) external view returns (address[] memory page) {
        uint256 total = farmerList.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + limit;
        if (end > total) end = total;
        page = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = farmerList[i];
        }
    }

    function getPlots(address farmer) external view returns (Plot[PLOT_COUNT] memory) {
        return _plots[farmer];
    }

    function getCrop(uint8 cropId) external view returns (Crop memory) {
        if (cropId >= CROP_COUNT) revert InvalidCrop();
        return crops[cropId];
    }

    // ---------- Gameplay ----------

    /// @notice Claim your one and only farm. Free. Requires an Agent ID.
    function claimLand() external whenNotPaused onlyAgentIdHolder {
        if (farms[msg.sender].claimed) revert AlreadyClaimed();
        farms[msg.sender].claimed = true;
        farmerList.push(msg.sender);
        emit LandClaimed(msg.sender);
    }

    function plant(uint8 plot, uint8 cropId) external whenNotPaused hasFarm onlyAgentIdHolder {
        if (plot >= PLOT_COUNT) revert InvalidPlot();
        if (cropId >= CROP_COUNT) revert InvalidCrop();
        Plot storage p = _plots[msg.sender][plot];
        if (p.active) revert PlotOccupied();

        Crop memory crop = crops[cropId];
        p.active = true;
        p.cropId = cropId;
        p.plantedAt = uint64(block.timestamp);
        p.readyAt = uint64(block.timestamp + crop.growTime);
        p.watered = false;
        emit Planted(msg.sender, plot, cropId, p.readyAt);
    }

    function water(uint8 plot) external whenNotPaused hasFarm {
        if (plot >= PLOT_COUNT) revert InvalidPlot();
        Plot storage p = _plots[msg.sender][plot];
        if (!p.active) revert PlotEmpty();
        if (p.watered) revert AlreadyWatered();
        p.watered = true;
        emit Watered(msg.sender, plot);
    }

    /// @notice Harvest a ready crop. Points: base x1.5 if watered; halved out of season.
    /// Produce units: full yield in season, yield - 1 out of season (min 1).
    function harvest(uint8 plot) external whenNotPaused nonReentrant hasFarm {
        if (plot >= PLOT_COUNT) revert InvalidPlot();
        Plot storage p = _plots[msg.sender][plot];
        if (!p.active) revert PlotEmpty();
        if (block.timestamp < p.readyAt) revert NotReady(p.readyAt);

        Crop memory crop = crops[p.cropId];
        bool inSeason = currentSeason() == crop.season;

        uint256 points = crop.basePoints;
        if (p.watered) points = (points * 3) / 2;
        if (!inSeason) points = points / 2;

        uint256 produce = crop.yieldUnits;
        if (!inSeason && produce > 1) produce -= 1;

        uint8 harvestedCrop = p.cropId;
        p.active = false;
        p.watered = false;

        Farm storage farm = farms[msg.sender];
        farm.dewpoints += points;
        farm.totalHarvests += 1;
        farm.totalProduce += produce;

        emit Harvested(msg.sender, plot, harvestedCrop, points, produce, inSeason);
    }

    /// @notice Water a neighbor's farm (social core of Sowcial). Both sides earn Dewpoints.
    /// Cooldown: once per helper->farmer pair per HELP_COOLDOWN.
    function helpNeighbor(address farmer) external whenNotPaused nonReentrant hasFarm onlyAgentIdHolder {
        if (farmer == msg.sender) revert CannotHelpSelf();
        if (!farms[farmer].claimed) revert NoFarm();
        uint256 availableAt = lastHelpAt[msg.sender][farmer] + HELP_COOLDOWN;
        if (block.timestamp < availableAt) revert HelpOnCooldown(availableAt);

        lastHelpAt[msg.sender][farmer] = block.timestamp;
        farms[msg.sender].dewpoints += HELP_POINTS_HELPER;
        farms[msg.sender].timesHelped += 1;
        farms[farmer].dewpoints += HELP_POINTS_FARMER;
        farms[farmer].timesHelpedBy += 1;

        emit NeighborHelped(msg.sender, farmer, HELP_POINTS_HELPER, HELP_POINTS_FARMER);
    }

    // ---------- Admin (documented, minimal) ----------

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
