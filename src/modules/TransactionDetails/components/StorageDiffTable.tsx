import { truncateString } from "@/shared/utils/string";
import { useCallback } from "react";

export default function StorageDiffTable(props: {
  table: any;
  pagination: any;
  setPagination: any;
}) {
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
            <th className="p-2 text-left">Contract Address</th>
            <th className="p-2 text-left">Key</th>
            <th className="p-2 text-left">Value</th>
            <th className="p-2 text-right">Block Number</th>
          </tr>
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <tr key={row.id} className="text-xs">
              <td className="p-2 cursor-pointer">
                <div className="flex items-center overflow-hidden">
                  <span className="whitespace-nowrap hover:text-blue-400 transition-all">
                    {truncateString(row.original.contract_address, 10)}
                  </span>
                </div>
              </td>

              <td className="p-2 cursor-pointer">
                <div className="flex items-center overflow-hidden">
                  <span className="hover:text-blue-400 transition-all">
                    {truncateString(row.original.key, 10)}
                  </span>
                </div>
              </td>

              <td className=" p-2 text-center">
                <div className="flex items-center">
                  <span className="uppercase text-right truncate">
                    {truncateString(row.original.value)}
                  </span>
                </div>
              </td>

              <td className=" p-2 text-center">
                <div className="flex items-center justify-end">
                  <span className="uppercase text-right truncate">
                    {row.original.block_number}
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
