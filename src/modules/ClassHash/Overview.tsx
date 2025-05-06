import { AccordionItem } from "@/shared/components/accordion";
import { Code } from "@/shared/components/contract/Code";
import { ContractForm } from "@/shared/components/contract/Form";
import { FunctionAbiWithAst } from "@/shared/utils/abi";

export function Overview({
  readFuncs,
  writeFuncs,
  code: {
    abi,
    sierra
  }
}: {
  readFuncs: FunctionAbiWithAst[],
  writeFuncs: FunctionAbiWithAst[],
  code: {
    abi: string,
    sierra?: string
  }
}) {
  return (
    <div className="bg-white flex flex-col gap-1 mt-[6px] overflow-auto">
      <AccordionItem
        title={`Read Functions (${readFuncs.length})`}
        content={<ContractForm functions={readFuncs} />}
        disabled={!readFuncs.length}
        titleClassName="z-20"
      />
      <AccordionItem
        title={`Write Functions (${writeFuncs.length})`}
        content={<ContractForm functions={writeFuncs} />}
        disabled={!writeFuncs.length}
        titleClassName="z-20"
      />
      <div className="border border-borderGray p-4">
        <Code abi={abi} sierra={sierra} />
      </div>
    </div>
  )
}
