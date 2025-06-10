export function getFinalityStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "REJECTED":
      return "Rejected";
    case "ACCEPTED_ON_L1":
      return "Accepted on L1";
    case "ACCEPTED_ON_L2":
      return "Accepted on L2";
  }
}
