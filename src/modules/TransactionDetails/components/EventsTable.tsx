import { ROUTES } from "@/constants/routes";
import { padNumber } from "@/shared/utils/number";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function EventsTable(props: {
  table: any;
  pagination: any;
  setPagination: any;
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
    <div className=" w-full flex flex-col gap-4 justify-between h-full">
      <table className="w-full table-auto border-collapse border-spacing-12">
        <thead>
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Block</th>
            <th className="p-2 text-right">From Address</th>
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr key={row.id} className="text-xs">
              <td className="p-2 cursor-pointer">
                <div className="flex items-center justify-center overflow-hidden">
                  <span className="whitespace-nowrap font-bold hover:text-blue-400 transition-all">
                    #
                    {padNumber(
                      index + 1 + pagination.pageIndex * pagination.pageSize
                    )}
                  </span>
                  <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                </div>
              </td>

              <td className="p-2 cursor-pointer">
                <div
                  onClick={() =>
                    navigate(
                      `${ROUTES.BLOCK_DETAILS.urlPath.replace(
                        ":blockNumber",
                        row.original.block
                      )}`
                    )
                  }
                  className="flex items-center justify-center overflow-hidden"
                >
                  <span className="hover:text-blue-400 transition-all">
                    {row.original.block}
                  </span>
                </div>
              </td>

              <td className=" p-2 text-center w-full">
                <div className="flex items-center justify-end">
                  <span className="flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                  <span className="uppercase text-right truncate">
                    {row.original.from}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-row justify-between items-center mt-4 px-2">
        <p>
          Showing <strong>{pagination.pageIndex + 1}</strong> of{" "}
          <strong>{table.getPageCount()}</strong> pages
        </p>

        <div className="flex flex-row gap-4">
          <button
            onClick={handlePreviousPage}
            className="bg-[#4A4A4A] text-white px-4 py-2 "
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            className="bg-[#4A4A4A] text-white px-4 py-2 "
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
