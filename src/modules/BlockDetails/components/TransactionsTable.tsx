import { ROUTES } from "@/constants/routes";
import { padNumber } from "@/shared/utils/number";
import { Table } from "@tanstack/react-table";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function TransactionsTable(props: {
  table: Table<any>;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: React.Dispatch<
    React.SetStateAction<{ pageIndex: number; pageSize: number }>
  >;
}) {
  const navigate = useNavigate();

  const { table, pagination, setPagination } = props;

  const handlePreviousPage = useCallback(() => {
    if (pagination.pageIndex === 0) return;
    setPagination((prev) => ({
      ...prev,
      pageIndex: prev.pageIndex - 1,
    }));
  }, [setPagination, pagination]);

  const handleNextPage = useCallback(() => {
    if (pagination.pageIndex === table.getPageCount() - 1) return;
    setPagination((prev) => ({
      ...prev,
      pageIndex: prev.pageIndex + 1,
    }));
  }, [setPagination, pagination, table]);

  return (
    <div className="flex flex-col w-full justify-between h-full">
      <table className="w-full table-auto border-collapse">
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
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
                    #
                    {padNumber(
                      index + 1 + pagination.pageIndex * pagination.pageSize
                    )}
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

      {/* PAGINATION CONTROLS */}
      <div className="flex flex-row justify-between items-center mt-4 px-2">
        <p>
          Showing <strong>{pagination.pageIndex + 1}</strong> of{" "}
          <strong>{table.getPageCount()}</strong> pages
        </p>

        <div className="flex flex-row gap-4">
          <button
            disabled={pagination.pageIndex === 0}
            onClick={handlePreviousPage}
            className="bg-[#4A4A4A] text-white px-4 py-2  disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled={pagination.pageIndex === table.getPageCount() - 1}
            onClick={handleNextPage}
            className="bg-[#4A4A4A] text-white px-4 py-2  disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
