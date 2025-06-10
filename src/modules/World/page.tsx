import { Editor } from "@/shared/components/editor";
import { useWorld } from "./hooks";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  cn,
  Input,
  GlobeIcon,
} from "@cartridge/ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
} from "@/shared/components/breadcrumb";
import { flexRender } from "@tanstack/react-table";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";

export function World() {
  const tab = useHashLinkTabs("graphql-schema");
  const {
    form,
    setForm,
    deployments,
    schema,
    models,
    model,
    txs,
    events,
    eventMessages,
  } = useWorld();

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>World</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader>
        <PageHeaderTitle>
          <GlobeIcon variant="solid" />
          <div>World ({form.project})</div>
        </PageHeaderTitle>
      </PageHeader>

      <div className="flex items-center gap-2">
        Project:{" "}
        {deployments ? (
          <Select
            onValueChange={(value) =>
              setForm((form) => ({
                ...form,
                project: value,
                model: undefined,
              }))
            }
            value={form.project}
          >
            <SelectTrigger className="bg-white border border-gray-300 rounded-md p-2 w-60">
              <SelectValue placeholder="project-name" />
            </SelectTrigger>
            <SelectContent className="bg-white w-60 border border-gray-300 rounded-md mt-1 max-h-[300px]">
              {deployments.map((d) => (
                <SelectItem
                  key={d}
                  value={d}
                  className="cursor-pointer p-2 hover:bg-gray-100"
                  simplified
                >
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="border border-gray-300 rounded-md p-2"
            value={form.project}
            onChange={(e) =>
              setForm((form) => ({
                ...form,
                project: e.target.value,
                model: undefined,
              }))
            }
          />
        )}
      </div>

      <div className="h-full flex-grow grid grid-rows-[min-content_1fr] gap-4">
        <Tabs value={tab.selected} onValueChange={tab.onChange}>
          <TabsList>
            <TabsTrigger value="graphql-schema">GraphQL Schema</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="model">Model</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="event-messages">Event Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="graphql-schema">
            <Editor
              height="80vh"
              defaultLanguage="json"
              value={JSON.stringify(schema, null, 2)}
              options={{
                readOnly: true,
              }}
            />
          </TabsContent>

          <TabsContent value="models">
            {models?.length ? (
              <Editor
                height="80vh"
                defaultLanguage="json"
                value={JSON.stringify(models, null, 2)}
                options={{
                  readOnly: true,
                }}
              />
            ) : (
              <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                <span className="text-[#D0D0D0]">No data found</span>
              </div>
            )}
          </TabsContent>

          <TabsContent value="model">
            {models?.length ? (
              <div className="flex flex-col gap-4">
                <Select
                  onValueChange={(value) =>
                    setForm((form) => ({ ...form, model: value }))
                  }
                  value={form.model}
                >
                  <SelectTrigger className="bg-white border border-gray-300 rounded-md p-2 w-60 overflow-x-auto">
                    <SelectValue placeholder="model name" />
                  </SelectTrigger>
                  <SelectContent className="bg-white w-60 border border-gray-300 rounded-md mt-1">
                    {models.map((m) => (
                      <SelectItem
                        key={m.name}
                        value={m.name}
                        className={cn(
                          "cursor-pointer p-2 hover:bg-gray-100",
                          // disabled prefix doesn't work for some reason
                          form.model === m.name
                            ? "opacity-50 cursor-not-allowed hover:bg-white"
                            : undefined,
                        )}
                        simplified
                        disabled={form.model === m.name}
                      >
                        {m.namespace} - {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Editor
                  height="80vh"
                  defaultLanguage="json"
                  value={JSON.stringify(model, null, 2)}
                  options={{
                    readOnly: true,
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-[80vh] flex items-center justify-center text-sm text-gray-500">
                no model found
              </div>
            )}
          </TabsContent>

          <TabsContent value="transactions">
            <Table table={txs} />
          </TabsContent>

          <TabsContent value="events">
            <Table table={events} />
          </TabsContent>

          <TabsContent value="event-messages">
            <Table table={eventMessages} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Table<
  T extends Table<T> & {
    pagination: { pageIndex: number; pageSize: number };
    setPagination: (pagination: {
      pageIndex: number;
      pageSize: number;
    }) => void;
  },
>({ table }: { table: T }) {
  return (
    <div>
      <table className="w-full h-min">
        <thead className="uppercase">
          <tr>
            {table.getHeaderGroups().map((headerGroup) =>
              headerGroup.headers.map((header) => (
                <th
                  key={`${headerGroup.id}-${header.id}`}
                  className="text-left"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              )),
            )}
          </tr>
        </thead>

        <tbody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row, id) => (
              <tr key={id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="text-left">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={table.getAllColumns().length}>No results found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-2 h-min flex flex-row gap-4 justify-between items-center">
        <div>
          Showing <strong>{table.pagination.pageIndex + 1}</strong> of{" "}
          <strong>{table.getPageCount() + 1}</strong> pages
        </div>

        <div className="flex flex-row gap-2">
          <button
            disabled={table.pagination.pageIndex === 0}
            onClick={() =>
              table.setPagination((prev) => ({
                ...prev,
                pageIndex: Math.max(0, prev.pageIndex - 1),
              }))
            }
            className="bg-[#4A4A4A] text-white px-2 disabled:opacity-50 uppercase"
          >
            Previous
          </button>
          <button
            disabled={
              table.getPageCount() === 0 ||
              table.pagination.pageIndex === table.getPageCount() - 1
            }
            onClick={() => {
              table.setPagination((prev) => ({
                ...prev,
                pageIndex: Math.min(
                  table.getPageCount() - 1,
                  prev.pageIndex + 1,
                ),
              }));
            }}
            className="bg-[#4A4A4A] text-white px-4 py-[3px] disabled:opacity-50 uppercase"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
