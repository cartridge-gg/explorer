import { AccordionItem } from "@/shared/components/accordion";
import { Code } from "@/shared/components/contract/Code";
import { ContractReadInterface } from "@/shared/components/contract/ReadContractInterface";
import { ContractWriteInterface } from "@/shared/components/contract/WriteContractInterface";
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
        content={<ContractReadInterface functions={readFuncs} />}
        titleClassName="z-10"
        disabled={!readFuncs.length}
      />
      <AccordionItem
        title={`Write Functions (${writeFuncs.length})`}
        content={<ContractWriteInterface functions={writeFuncs} />}
        titleClassName="z-10"
        disabled={!writeFuncs.length}
      />
      <div className="border border-borderGray p-4">
        <Code abi={abi} sierra={sierra} />
      </div>
    </div>
  )
}
