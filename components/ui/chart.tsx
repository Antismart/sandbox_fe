"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Workaround for https://github.com/recharts/recharts/issues/3615
const Customized = <T extends object>(
  props: T & {
    component: React.ComponentType<T>
  },
) => {
  const { component: Component, ...rest } = props
  return <Component {...rest} />
}

const ChartContext = React.createContext<{
  config: ChartConfig
} | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <Chart />")
  }

  return context
}

type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContainerProps = {
  config: ChartConfig
  children: React.ReactNode
} & React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, className, children, ...props }, ref) => {
    const newConfig = React.useMemo(() => {
      if (config) {
        return Object.entries(config).map(([key, value]) => ({
          key,
          ...value,
        }))
      }
      return []
    }, [config])

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          className={cn("flex h-[350px] w-full flex-col items-center justify-center", className)}
          {...props}
        >
          <RechartsPrimitive.ResponsiveContainer {...props}>{children}</RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    )
  },
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentPropsWithoutRef<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      is
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      ...props
    },
    ref,
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel) {
        return null
      }

      if (labelFormatter) {
        return <div className={cn("font-medium", labelClassName)}>{labelFormatter(label, payload)}</div>
      }

      if (labelKey) {
        return <div className={cn("font-medium", labelClassName)}>{payload?.[0]?.payload[labelKey]}</div>
      }

      return <div className={cn("font-medium", labelClassName)}>{label || "Unknown"}</div>
    }, [hideLabel, labelFormatter, label, payload, labelClassName, labelKey])

    if (active && payload && payload.length) {
      return (
        <div
          ref={ref}
          className={cn("rounded-lg border border-border bg-background p-2 text-sm shadow-md", className)}
          {...props}
        >
          {tooltipLabel}
          <div className="grid gap-1.5">
            {payload.map((item: any, i: number) => {
              if (item.dataKey === "tooltip") return null

              const value = formatter ? formatter(item.value, item.name, item, i) : item.value
              const name = nameKey ? item.payload[nameKey] : item.nameKey || item.name

              const content = config[item.dataKey as keyof typeof config]

              return (
                <div key={item.dataKey} className="flex items-center gap-2 [&>svg]:size-2.5">
                  {hideIndicator ? null : indicator === "dot" ? (
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: color || item.color || content?.color,
                      }}
                    />
                  ) : (
                    <content.icon />
                  )}
                  {content?.label || name}: {value}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return null
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Legend> &
    React.ComponentPropsWithoutRef<"div"> & {
      hideIndicator?: boolean
      nameKey?: string
    }
>(({ className, hideIndicator = false, formatter, nameKey, ...props }, ref) => {
  const { config } = useChart()

  return (
    <div ref={ref} className={cn("flex flex-wrap items-center justify-center gap-4", className)} {...props}>
      {props.payload?.map((item: any) => {
        const content = config[item.dataKey as keyof typeof config]

        if (!content) return null

        const name = nameKey ? item.payload[nameKey] : item.name

        return (
          <div key={item.value} className="flex items-center gap-1.5 [&>svg]:size-3">
            {hideIndicator ? null : content.icon ? (
              <content.icon />
            ) : (
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: content.color,
                }}
              />
            )}
            {formatter ? formatter(name, item, item.value) : name}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  // Recharts
  RechartsPrimitive as Recharts,
  Customized,
}
