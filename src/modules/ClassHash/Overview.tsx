import { AccordionItem } from "@/shared/components/accordion";
import { ContractReadInterface } from "@/shared/components/contract/ReadContractInterface";
import { ContractWriteInterface } from "@/shared/components/contract/WriteContractInterface";
import { Function } from "@/shared/components/contract/types";

export function Overview({
  readFuncs,
  writeFuncs
}: {
  readFuncs: Function[],
  writeFuncs: Function[]
}) {
  return (
    <div className="bg-white flex flex-col gap-1 mt-[6px] overflow-auto">
      <AccordionItem title="Read Functions" content={<ContractReadInterface functions={readFuncs} />} />
      <AccordionItem title="Write Functions" content={<ContractWriteInterface functions={writeFuncs} />} />
    </div>
  )
}
