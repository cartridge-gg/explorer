import { ROUTES } from "@/constants/routes";
import { padNumber } from "@/shared/utils/number";
import { truncateString } from "@/shared/utils/string";
import { useNavigate } from "react-router-dom";

export default function DataTable(props: {
  transaction_table: any;
  events_table: any;
  show: string;
}) {
  const navigate = useNavigate();
  const { transaction_table, events_table, show } = props;

  if (show === "Transactions" && transaction_table) {
    return (
      <table className="w-full table-auto border-collapse">
        <tbody>
          {transaction_table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className="text-xs"
              onClick={() =>
                navigate(
                  `${ROUTES.TRANSACTION_DETAILS.urlPath.replace(
                    ":txHash",
                    row.original.hash
                  )}`
                )
              }
            >
              <td className="w-1 p-2 whitespace-nowrap cursor-pointer">
                <div className="flex items-center overflow-hidden">
                  <span className="whitespace-nowrap font-bold hover:text-blue-400 transition-all">
                    # {padNumber(index + 1)}
                  </span>
                </div>
              </td>

              <td className="w-full p-2 cursor-pointer">
                <div className="flex items-center overflow-hidden">
                  <span className="whitespace-nowrap hover:text-blue-400 transition-all">
                    {row.original.hash_display}
                  </span>
                  <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                </div>
              </td>

              <td className="w-1 whitespace-nowrap p-2">
                <div className="flex items-center">
                  <span className="whitespace-nowrap uppercase text-right">
                    {row.original.status}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (show === "Events" && events_table) {
    return (
      <table className="w-full table-auto border-collapse border-spacing-12">
        <thead>
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Txn Hash</th>
            <th className="p-2 text-right">From</th>
          </tr>
        </thead>
        <tbody>
          {events_table.getRowModel().rows.map((row, index) => (
            <tr key={row.id} className="text-xs">
              <td className="p-2 cursor-pointer w-1/4">
                <div className="flex items-center justify-start overflow-hidden">
                  <span className="whitespace-nowrap font-bold hover:text-blue-400 transition-all">
                    # {padNumber(index + 1)}
                  </span>
                  <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                </div>
              </td>

              <td className="p-2 cursor-pointer w-full">
                <div
                  onClick={() =>
                    navigate(
                      `${ROUTES.TRANSACTION_DETAILS.urlPath.replace(
                        ":txHash",
                        row.original.txn_hash
                      )}`
                    )
                  }
                  className="flex w-full items-center justify-center overflow-hidden"
                >
                  <span className="hover:text-blue-400 transition-all">
                    {truncateString(row.original.txn_hash, 10)}
                  </span>
                  <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                </div>
              </td>

              <td className=" p-2 w-1/3 text-center">
                <div className="flex w-full items-center justify-end">
                  <span className="uppercase text-right truncate">
                    {truncateString(row.original.from, 10)}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}
