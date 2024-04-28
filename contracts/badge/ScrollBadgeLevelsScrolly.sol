// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Attestation } from "@eas/contracts/IEAS.sol";

import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";

import { ScrollBadgeAccessControl } from
    "@canva-contracts/badge/extensions/ScrollBadgeAccessControl.sol";
import { ScrollBadgeDefaultURI } from "@canva-contracts/badge/extensions/ScrollBadgeDefaultURI.sol";
import { ScrollBadgeEligibilityCheck } from
    "@canva-contracts/badge/extensions/ScrollBadgeEligibilityCheck.sol";
import { ScrollBadgeNoExpiry } from "@canva-contracts/badge/extensions/ScrollBadgeNoExpiry.sol";
import { ScrollBadgeSelfAttest } from "@canva-contracts/badge/extensions/ScrollBadgeSelfAttest.sol";
import { ScrollBadgeSingleton } from "@canva-contracts/badge/extensions/ScrollBadgeSingleton.sol";
import { ScrollBadge } from "@canva-contracts/badge/ScrollBadge.sol";
import { Unauthorized } from "@canva-contracts/Errors.sol";

import { IActivityPoints } from "../interfaces/IActivityPoints.sol";

function decodePayloadData(bytes memory data) pure returns (uint8) {
    return abi.decode(data, (uint8));
}

/**
 * @title ScrollBadgeLevelsScrolly
 * @author Alderian
 * @notice A badge that represents the Scrolly user's level.
 */
contract ScrollBadgeLevelsScrolly is
    ScrollBadgeAccessControl,
    ScrollBadgeDefaultURI,
    ScrollBadgeEligibilityCheck,
    ScrollBadgeNoExpiry,
    ScrollBadgeSingleton,
    ScrollBadgeSelfAttest
{
    uint256 public immutable MINIMUM_POINTS_ELIGIBILITY = 1 ether;
    uint256 public immutable MINIMUM_POINTS_LEVEL_0 = 333 ether;
    uint256 public immutable MINIMUM_POINTS_LEVEL_1 = 777 ether;
    uint256 public immutable MINIMUM_POINTS_LEVEL_2 = 1337 ether;
    uint256 public immutable MINIMUM_POINTS_LEVEL_3 = 2442 ether;
    uint256 public immutable MINIMUM_POINTS_LEVEL_4 = 4200 ether;
    // uint256 immutable public MINIMUM_POINTS_LEVEL_5 = inf;

    address private apAddress; // activity points contract address
    string public baseBadgeURI;

    constructor(
        address resolver_,
        address activityPoints_,
        string memory _defaultBadgeURI, // IPFS, HTTP, or data URL
        string memory _baseBadgeURI // IPFS, HTTP, or data URL to add level to get image
    )
        ScrollBadge(resolver_)
        ScrollBadgeDefaultURI(_defaultBadgeURI)
    {
        apAddress = activityPoints_;
        baseBadgeURI = _baseBadgeURI;
    }

    /// @inheritdoc ScrollBadge
    function onIssueBadge(Attestation calldata attestation)
        internal
        override(
            ScrollBadge,
            ScrollBadgeAccessControl,
            ScrollBadgeNoExpiry,
            ScrollBadgeSingleton,
            ScrollBadgeSelfAttest
        )
        returns (bool)
    {
        if (!isEligible(attestation.recipient)) {
            revert Unauthorized();
        }

        return super.onIssueBadge(attestation);
    }

    /// @inheritdoc ScrollBadge
    function onRevokeBadge(Attestation calldata attestation)
        internal
        override(
            ScrollBadge,
            ScrollBadgeAccessControl,
            ScrollBadgeNoExpiry,
            ScrollBadgeSingleton,
            ScrollBadgeSelfAttest
        )
        returns (bool)
    {
        return super.onRevokeBadge(attestation);
    }

    /// @inheritdoc ScrollBadgeDefaultURI
    function getBadgeTokenURI(bytes32 uid) internal view override returns (string memory) {
        // We get current user level from latest attestation (using provided badge logic)
        uint8 level = getCurrentLevel(uid);

        return string(abi.encode(baseBadgeURI, Strings.toString(level), ".json"));
    }

    function getCurrentLevel(bytes32 uid) public view returns (uint8) {
        Attestation memory badge = getAndValidateBadge(uid);
        return getLevel(badge.recipient);
    }

    function isEligible(address recipient) public view override returns (bool) {
        return (IActivityPoints(apAddress).getPoints(recipient) >= MINIMUM_POINTS_ELIGIBILITY);
    }

    function getPoints(address recipient) public view returns (uint256) {
        return IActivityPoints(apAddress).getPoints(recipient);
    }

    function getLevel(address recipient) public view returns (uint8) {
        return determineBadgeLevel(IActivityPoints(apAddress).getPoints(recipient));
    }

    function determineBadgeLevel(uint256 points) public pure returns (uint8) {
        if (points <= MINIMUM_POINTS_LEVEL_0) {
            return 0; // Scrolly Baby
        } else if (points <= MINIMUM_POINTS_LEVEL_1) {
            return 1; // Scrolly Novice
        } else if (points <= MINIMUM_POINTS_LEVEL_2) {
            return 2; // Scrolly Explorer
        } else if (points <= MINIMUM_POINTS_LEVEL_3) {
            return 3; // Master Mapper
        } else if (points <= MINIMUM_POINTS_LEVEL_4) {
            return 4; // Carto Maestro
        } else {
            return 5; // Grand Cartographer of Scrolly
        }
    }

    function setDefaultBadgeURI(string memory _defaultBadgeURI) external onlyOwner {
        defaultBadgeURI = _defaultBadgeURI;
    }

    function setBaseBadgeURI(string memory _baseBadgeURI) external onlyOwner {
        baseBadgeURI = _baseBadgeURI;
    }
}
