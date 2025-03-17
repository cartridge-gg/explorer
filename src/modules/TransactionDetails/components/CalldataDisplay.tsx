import React from "react";

export default function CalldataDisplay(props: {
  calldata: { selector: string; contract: string; args: string[] }[];
}) {
  const [expanded, setExpanded] = React.useState(
    Array(props.calldata.length).fill(true)
  );
  return (
    <div className="w-full flex flex-col gap-4 h-full px-2">
      {props.calldata.map((data, index) => (
        <div
          onClick={() =>
            setExpanded((prev) => {
              const newExpanded = [...prev];
              newExpanded[index] = !newExpanded[index];
              return newExpanded;
            })
          }
          key={index}
          className="w-full flex flex-col gap-4 border border-gray-300 p-4 cursor-pointer"
        >
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className=" text-md font-bold">
              CONTRACT ADDRESS : {data.contract}
            </div>
            <div className="">{expanded[index] ? "Collapse" : "Expand"}</div>
          </div>
          <div className={`${expanded[index] ? "block" : "hidden"}`}>
            <table className="w-full border-gray-300">
              <tbody>
                <React.Fragment key={index}>
                  <tr className="">
                    <td className="p-2 font-bold text-left">Selector:</td>
                    <td className="p-2 text-left">{data.selector}</td>
                  </tr>
                  <tr className="">
                    <td className="p-2 font-bold border-0 flex justify-start">
                      Arguments:
                    </td>
                    <td className="p-2">
                      <ul className="text-left">
                        {data.args.map((arg, argIndex) => (
                          <li key={argIndex}>{arg}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </React.Fragment>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
