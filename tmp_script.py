from pathlib import Path
path = Path('components/DateSelector.tsx')
text = path.read_text(encoding='utf-8')
start_token = "            {/* Room Cards */}"
end_token = "            {/* No rooms available */}"
start = text.index(start_token)
end = text.index(end_token)
new_block = "            {/* Room Cards */}\r\n            {hasRequestedAvailability && !loadingRooms && roomsToDisplay.length > 0 && (\r\n              <div className=\"accommodation-cards-grid mb-6 flex flex-col gap-4\" style={{ overflow: 'visible' }}>\r\n                {roomsToDisplay.map((room) => {\r\n                  const features = getRoomFeatures(room.roomTypeId);\r\n                  const isUnavailable = room.availableRooms === 0;\r\n                  const isSelected = !isUnavailable && selectedRoom?.roomTypeId === room.roomTypeId;\r\n                  const roomPrice = room.isSharedRoom ? room.pricePerNight * (bookingData.guests || 1) : room.pricePerNight;\r\n                  const totalPrice = room.isSharedRoom\r\n                    ? room.pricePerNight * nights * (bookingData.guests || 1)\r\n                    : room.pricePerNight * nights;\r\n                  const roomDescriptions = raw<Record[str, { desktop: str; mobile: str }]>('accommodation.roomDescriptions') or {}\r\n                  const description = roomDescriptions.get(room.roomTypeId, {\"desktop\": room.roomTypeName, \"mobile\": room.roomTypeName})\r\n                  return f"                    <div key={room.roomTypeId} className=\"mb-2 md:mb-0\">..."
