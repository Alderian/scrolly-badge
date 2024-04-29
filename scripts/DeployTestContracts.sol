// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import { Script } from "forge-std/src/Script.sol";
import { console } from "forge-std/src/console.sol";

import { SchemaRegistry, ISchemaRegistry } from "@eas/contracts/SchemaRegistry.sol";
import { EAS } from "@eas/contracts/EAS.sol";

import { ProxyAdmin } from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import {
    ITransparentUpgradeableProxy,
    TransparentUpgradeableProxy
} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import { AttesterProxy } from "@canva-contracts/AttesterProxy.sol";
import { ScrollBadgeResolver } from "@canva-contracts/resolver/ScrollBadgeResolver.sol";
import { ProfileRegistry } from "@canva-contracts/profile/ProfileRegistry.sol";
import { Profile } from "@canva-contracts/profile/Profile.sol";
import { ProfileRegistry } from "@canva-contracts/profile/ProfileRegistry.sol";
import { EmptyContract } from "@canva-contracts/misc/EmptyContract.sol";

import { ScrollBadgeLevelsScrolly } from "../contracts/badge/ScrollBadgeLevelsScrolly.sol";
import { MockActivityPoints } from "../contracts/mock/mockActivityPoints.sol";

contract DeployTestContracts is Script {
    uint256 DEPLOYER_PRIVATE_KEY = vm.envUint("DEPLOYER_PRIVATE_KEY");
    address SIGNER_ADDRESS = vm.envAddress("SIGNER_ADDRESS");
    address TREASURY_ADDRESS = vm.envAddress("TREASURY_ADDRESS");
    address ATTESTER_ADDRESS = vm.envAddress("ATTESTER_ADDRESS");
    // address ACTIVITY_POINTS_ADDRESS = vm.envAddress("ACTIVITY_POINTS_ADDRESS");

    function run() external {
        vm.startBroadcast(DEPLOYER_PRIVATE_KEY);

        // deploy EAS
        SchemaRegistry schemaRegistry = new SchemaRegistry();
        EAS eas = new EAS(schemaRegistry);

        // deploy proxy admin
        ProxyAdmin proxyAdmin = new ProxyAdmin();

        // deploy profile registry placeholder
        address placeholder = address(new EmptyContract());
        address profileRegistryProxy =
            address(new TransparentUpgradeableProxy(placeholder, address(proxyAdmin), ""));

        // deploy Scroll badge resolver
        address resolverImpl = address(new ScrollBadgeResolver(address(eas), profileRegistryProxy));
        address resolverProxy =
            address(new TransparentUpgradeableProxy(resolverImpl, address(proxyAdmin), ""));
        ScrollBadgeResolver resolver = ScrollBadgeResolver(payable(resolverProxy));
        resolver.initialize();

        bytes32 schema = resolver.schema();

        // deploy profile implementation and upgrade registry
        Profile profileImpl = new Profile(address(resolver));
        ProfileRegistry profileRegistryImpl = new ProfileRegistry();
        proxyAdmin.upgrade(
            ITransparentUpgradeableProxy(profileRegistryProxy), address(profileRegistryImpl)
        );
        ProfileRegistry(profileRegistryProxy).initialize(
            TREASURY_ADDRESS, SIGNER_ADDRESS, address(profileImpl)
        );

        // deploy mock ActivityPoints (for test only)
        MockActivityPoints activityPoints = new MockActivityPoints();

        // deploy test badge
        ScrollBadgeLevelsScrolly badge = new ScrollBadgeLevelsScrolly(
            address(resolver),
            address(activityPoints),
            "http://127.0.0.1:3000/api/badge/token",
            "http://127.0.0.1:3000/api/badge/token?level="
        );
        AttesterProxy proxy = new AttesterProxy(eas);

        // set permissions
        resolver.toggleBadge(address(badge), true);
        badge.toggleAttester(address(proxy), true);
        proxy.toggleAttester(ATTESTER_ADDRESS, true);

        // log addresses
        logAddress("EAS_REGISTRY_CONTRACT_ADDRESS", address(schemaRegistry));
        logAddress("EAS_MAIN_CONTRACT_ADDRESS", address(eas));
        logAddress("SCROLL_BADGE_PROXY_ADMIN_ADDRESS", address(proxyAdmin));
        logAddress("SCROLL_BADGE_RESOLVER_CONTRACT_ADDRESS", address(resolver));
        logBytes32("SCROLL_BADGE_SCHEMA_UID", schema);
        logAddress("SIMPLE_BADGE_CONTRACT_ADDRESS", address(badge));
        logAddress("SIMPLE_BADGE_ATTESTER_PROXY_CONTRACT_ADDRESS", address(proxy));
        logAddress("SCROLL_PROFILE_IMPLEMENTATION_CONTRACT_ADDRESS", address(profileImpl));
        logAddress(
            "SCROLL_PROFILE_REGISTRY_IMPLEMENTATION_CONTRACT_ADDRESS", address(profileRegistryImpl)
        );
        logAddress("SCROLL_PROFILE_REGISTRY_PROXY_CONTRACT_ADDRESS", address(profileRegistryProxy));

        vm.stopBroadcast();
    }

    function logAddress(string memory name, address addr) internal view {
        console.log(string(abi.encodePacked(name, "=", vm.toString(address(addr)))));
    }

    function logBytes32(string memory name, bytes32 data) internal view {
        console.log(string(abi.encodePacked(name, "=", vm.toString(data))));
    }
}
