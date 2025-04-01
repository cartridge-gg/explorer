import FeltDisplay from "./FeltDisplay";
import { FeltDisplayVariants } from "./FeltDisplayAsToggle";

type FeltListProps = {
  /**
   * Array of felts to be displayed in the list
   */
  list: bigint[];
  displayAs?: Exclude<FeltDisplayVariants, "string">;
  /**
   * Whether to display the index column
   */
  showIndex?: boolean;
};

export default function FeltList({
  list,
  displayAs = "hex",
  showIndex = true,
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
              {showIndex ? (
                <td className="px-4 text-center font-bold select-none w-[54px]">
                  {index}
                </td>
              ) : (
                <></>
              )}

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
