// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EventCheckIn {

    address public owner;
    struct Event {
        string name;
        uint256 date;
        uint256 maxParticipants;
        uint256 registeredCount;
        uint256 checkedInCount;
        address organizer;
        mapping(address => bool) isRegistered;
        mapping(address => bool) hasCheckedIn;
        address[] topThreeCheckins;
        uint256 rewardAmount;
        bool isActive;
    }

    mapping(uint256 => Event) public events;
    uint256 public eventCount;

    event EventCreated(uint256 indexed eventId, string name, uint256 date);
    event ParticipantRegistered(uint256 indexed eventId, address participant);
    event ParticipantCheckedIn(uint256 indexed eventId, address participant, uint256 position);
    event RewardDistributed(uint256 indexed eventId, address participant, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOrganizer(uint256 eventId) {
        require(events[eventId].organizer == msg.sender, "Not the event organizer");
        _;
    }

    modifier eventExists(uint256 eventId) {
        require(eventId < eventCount, "Event does not exist");
        _;
    }

    function createEvent(
        string memory name,
        uint256 date,
        uint256 maxParticipants
    ) external payable {
        require(date > block.timestamp, "Event date must be in the future");
        require(maxParticipants > 0, "Max participants must be greater than 0");
        require(msg.value > 0, "Must provide rewards pool");

        uint256 eventId = eventCount++;
        Event storage newEvent = events[eventId];
        newEvent.name = name;
        newEvent.date = date;
        newEvent.maxParticipants = maxParticipants;
        newEvent.organizer = msg.sender;
        newEvent.rewardAmount = msg.value;
        newEvent.isActive = true;

        emit EventCreated(eventId, name, date);
    }

    function registerForEvent(uint256 eventId) external eventExists(eventId) {
        Event storage eventData = events[eventId];
        require(eventData.isActive, "Event is not active");
        require(!eventData.isRegistered[msg.sender], "Already registered");
        require(eventData.registeredCount < eventData.maxParticipants, "Event is full");
        require(block.timestamp < eventData.date, "Registration closed");

        eventData.isRegistered[msg.sender] = true;
        eventData.registeredCount++;

        emit ParticipantRegistered(eventId, msg.sender);
    }

    function checkIn(uint256 eventId, address participant) external 
        eventExists(eventId) 
        onlyOrganizer(eventId) 
    {
        Event storage eventData = events[eventId];
        require(eventData.isActive, "Event is not active");
        require(eventData.isRegistered[participant], "Participant not registered");
        require(!eventData.hasCheckedIn[participant], "Already checked in");
        require(block.timestamp >= eventData.date, "Event hasn't started");

        eventData.hasCheckedIn[participant] = true;
        eventData.checkedInCount++;

        if (eventData.topThreeCheckins.length < 3) {
            eventData.topThreeCheckins.push(participant);
            emit ParticipantCheckedIn(eventId, participant, eventData.topThreeCheckins.length);

            // Distribute reward immediately for top 3
            uint256 reward = calculateReward(eventData.rewardAmount, eventData.topThreeCheckins.length);
            payable(participant).transfer(reward);
            emit RewardDistributed(eventId, participant, reward);
        }
    }

    function calculateReward(uint256 totalReward, uint256 position) internal pure returns (uint256) {
        if (position == 1) return (totalReward * 50) / 100; // 50% for first
        if (position == 2) return (totalReward * 30) / 100; // 30% for second
        if (position == 3) return (totalReward * 20) / 100; // 20% for third
        return 0;
    }

    function getEventDetails(uint256 eventId) external view 
        eventExists(eventId) 
        returns (
            string memory name,
            uint256 date,
            uint256 maxParticipants,
            uint256 registeredCount,
            uint256 checkedInCount,
            address organizer,
            uint256 rewardAmount,
            bool isActive
        ) 
    {
        Event storage eventData = events[eventId];
        return (
            eventData.name,
            eventData.date,
            eventData.maxParticipants,
            eventData.registeredCount,
            eventData.checkedInCount,
            eventData.organizer,
            eventData.rewardAmount,
            eventData.isActive
        );
    }

    function getTopThreeCheckins(uint256 eventId) external view 
        eventExists(eventId) 
        returns (address[] memory) 
    {
        return events[eventId].topThreeCheckins;
    }

    function isParticipantRegistered(uint256 eventId, address participant) external view 
        eventExists(eventId) 
        returns (bool) 
    {
        return events[eventId].isRegistered[participant];
    }

    function hasParticipantCheckedIn(uint256 eventId, address participant) external view 
        eventExists(eventId) 
        returns (bool) 
    {
        return events[eventId].hasCheckedIn[participant];
    }
}