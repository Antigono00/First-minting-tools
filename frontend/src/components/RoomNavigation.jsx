// src/components/RoomNavigation.jsx
import React from 'react';
import { useContext } from 'react';
import { GameContext } from '../context/GameContext';

const RoomNavigation = () => {
  const { 
    currentRoom,
    roomsUnlocked, 
    setCurrentRoom,
    addNotification
  } = useContext(GameContext);

  // Don't show navigation if there's only one room unlocked
  if (roomsUnlocked <= 1) {
    return null;
  }

  const handleRoomChange = (newRoom) => {
    // Only navigate if the room is different and unlocked
    if (newRoom !== currentRoom && newRoom <= roomsUnlocked) {
      setCurrentRoom(newRoom);
      addNotification(`Entered Room ${newRoom}`, 400, 300, "#4CAF50");
    }
  };

  return (
    <div className="room-navigation">
      {/* Show left arrow when in room 2 */}
      {currentRoom === 2 && (
        <button 
          className="room-nav-button prev"
          onClick={() => handleRoomChange(1)}
          aria-label="Go to previous room"
        >
          ←
        </button>
      )}

      {/* Show right arrow when in room 1 */}
      {currentRoom === 1 && (
        <button 
          className="room-nav-button next"
          onClick={() => handleRoomChange(2)}
          aria-label="Go to next room"
        >
          →
        </button>
      )}

      {/* Room indicator */}
      <div className="room-indicator">
        Room {currentRoom} of {roomsUnlocked}
      </div>
    </div>
  );
};

export default RoomNavigation;
