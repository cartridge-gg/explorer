import { Code } from "@/shared/components/contract/Code";
import { ContractForm } from "@/shared/components/contract/Form";
import { FunctionAbiWithAst } from "@/shared/utils/abi";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/accordion";
import { BookIcon, CodeIcon, PencilIcon } from "@cartridge/ui";

export function Overview({
  readFuncs,
  writeFuncs,
  code: { abi, sierra },
}: {
  readFuncs: FunctionAbiWithAst[];
  writeFuncs: FunctionAbiWithAst[];
  code: {
    abi: string;
    sierra?: string;
  };
}) {
  return (
    <div className="bg-white flex flex-col gap-1 mt-[6px] overflow-auto">
      <Accordion defaultValue="code" className="flex flex-col gap-2">
        <AccordionItem value="read" className="border rounded">
          <AccordionTrigger>
            <BookIcon variant="solid" />
            Read Functions ({readFuncs.length})
          </AccordionTrigger>
          <AccordionContent>
            <ContractForm functions={readFuncs} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="write" className="border rounded">
          <AccordionTrigger>
            <PencilIcon variant="solid" />
            Write Functions ({writeFuncs.length})
          </AccordionTrigger>
          <AccordionContent>
            <ContractForm functions={writeFuncs} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="code" className="border rounded">
          <AccordionTrigger>
            <CodeIcon variant="solid" />
            Code
          </AccordionTrigger>
          <AccordionContent className="p-3">
            <Code abi={abi} sierra={sierra} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
