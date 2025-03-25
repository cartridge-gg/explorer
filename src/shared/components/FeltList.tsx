import FeltDisplay from "./FeltDisplay";

type FeltListProps = {
  /**
   * Array of felts to be displayed in the list
   */
  list: bigint[];
  displayAs?: "hex" | "decimal";
};

export default function FeltList({
  list,
  displayAs = "decimal",
}: FeltListProps) {
  return (
    <table className="w-full border">
      <tbody>
        {list.map((elem, index) => {
          return (
            <tr
              key={index}
              className={`${index !== list.length - 1 ? "border-b" : ""}`}
            >
              <td className="px-4 text-center font-bold select-none w-[20px]">
                {index}
              </td>
              <td className="px-4 text-left">
                <FeltDisplay value={elem} displayAs={displayAs} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
