// paginated response for latest block_numbers
export const getPaginatedBlockNumbers = (
  block_number: number,
  limit: number
) => {
  const blockNumbers = [];
  for (let i = block_number; i > block_number - limit; i--) {
    blockNumbers.push(i);
  }
  return blockNumbers;
};
