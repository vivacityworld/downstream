// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IGaugeController {
    // Constants
    function WEEK() external view returns (uint256);
    function MULTIPLIER() external view returns (uint256);

    // Events
    event NewType(string name, int128 type_id);
    event NewGauge(address indexed gauge_address, int128 gauge_type);
    event GaugeRemoved(address indexed gauge_address);

    // State
    function votingEscrow() external view returns (address);
    function governance() external view returns (address);
    function n_gauge_types() external view returns (int128);
    function gauge_type_names(int128) external view returns (string memory);
    function gauge_types_(address) external view returns (int128);
    function is_removed(address) external view returns (bool);
    function vote_user_slopes(address, address) external view returns (uint256 slope, uint256 power, uint256 end);
    function vote_user_power(address) external view returns (uint256);
    function last_user_vote(address, address) external view returns (uint256);
    function points_weight(address, uint256) external view returns (uint256 bias, uint256 slope);
    function changes_weight(address, uint256) external view returns (uint256);
    function time_weight(address) external view returns (uint256);
    function points_sum(int128, uint256) external view returns (uint256 bias, uint256 slope);
    function changes_sum(int128, uint256) external view returns (uint256);
    function time_sum(int128) external view returns (uint256);
    function points_total(uint256) external view returns (uint256);
    function time_total() external view returns (uint256);
    function points_type_weight(int128, uint256) external view returns (uint256);
    function time_type_weight(int128) external view returns (uint256);

    // Functions
    function setGovernance(address _governance) external;
    function gauge_types(address _addr) external view returns (int128);
    function add_gauge(address addr, int128 gauge_type) external;
    function remove_gauge(address _gauge) external;
    function checkpoint() external;
    function checkpoint_gauge(address _gauge) external;
    function gauge_relative_weight(address _gauge, uint256 _time) external view returns (uint256);
    function gauge_relative_weight_write(address _gauge, uint256 _time) external returns (uint256);
    function add_type(string memory _name, uint256 _weight) external;
    function change_type_weight(int128 type_id, uint256 weight) external;
    function vote_for_gauge_weights(address _gauge_addr, uint256 _user_weight) external;
    function get_gauge_weight(address _gauge) external view returns (uint256);
    function get_type_weight(int128 type_id) external view returns (uint256);
    function get_total_weight() external view returns (uint256);
    function get_weights_sum_per_type(int128 type_id) external view returns (uint256);
}
