// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IActivityPoints {
    function getPoints(address user_) external view returns (uint256);
}
