import { ROUTES } from "@/constants/routes";
import { truncateString } from "@/shared/utils/string";
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
    <div className="px-4 sm:w-full w-screen overflow-x-auto flex flex-col gap-4 justify-between h-full">
      <table className="table-auto border-collapse border-spacing-12">
        <thead>
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">From Address</th>
            <th className="p-2 text-left">Event Name</th>
            <th className="p-2 text-right">Block</th>
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr key={row.id} className="text-xs">
              <td className="p-2 cursor-pointer">
                <div
                  className="flex justify-start overflow-hidden"
                  onClick={() =>
                    navigate(
                      `${ROUTES.EVENT_DETAILS.urlPath.replace(
                        ":eventId",
                        row.original.id
                      )}`
                    )
                  }
                >
                  <span className="whitespace-nowrap hover:text-blue-400 transition-all">
                    {truncateString(row.original.id)}
                  </span>
                  <span className="sm:visible hidden flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                </div>
              </td>

              <td className=" p-2 text-center">
                <div className="flex items-center justify-start">
                  <span className="sm:visible hidden flex-grow border-dotted border-b border-gray-500 mx-2"></span>
                  <span
                    onClick={() =>
                      navigate(
                        `${ROUTES.CONTRACT_DETAILS.urlPath.replace(
                          ":contractAddress",
                          row.original.from
                        )}`
                      )
                    }
                    className="uppercase hover:text-blue-400 transition-all cursor-pointer text-right truncate"
                  >
                    {truncateString(row.original.from)}
                  </span>
                </div>
              </td>

              <td className="p-2 text-left">
                <div className="flex items-center justify-start">
                  <span className="text-right truncate">
                    {row.original.event_name}
                  </span>
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
                  className="flex items-center justify-end overflow-hidden"
                >
                  <span className="hover:text-blue-400 transition-all">
                    {row.original.block}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex sticky sm:relative bottom-0 left-0 flex-row gap-4 sm:justify-between items-center mt-4">
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
