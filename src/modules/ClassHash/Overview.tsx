import { AccordionItem } from "@/shared/components/accordion";
import { Code } from "@/shared/components/contract/Code";
import { ContractReadInterface } from "@/shared/components/contract/ReadContractInterface";
import { ContractWriteInterface } from "@/shared/components/contract/WriteContractInterface";
import { Function } from "@/shared/components/contract/types";

export function Overview({
  readFuncs,
  writeFuncs,
  abi,
  sierra
}: {
  readFuncs: Function[],
  writeFuncs: Function[],
  abi: string,
  sierra?: string
}) {
  return (
    <div className="bg-white flex flex-col gap-1 mt-[6px] overflow-auto">
      <AccordionItem title="Read Functions" content={<ContractReadInterface functions={readFuncs} />} titleClassName="z-10" />
      <AccordionItem title="Write Functions" content={<ContractWriteInterface functions={writeFuncs} />} titleClassName="z-10" />
      <div className="border border-borderGray p-4">
        <Code abi={abi} sierra={sierra} />
      </div>
    </div>
  )
}
