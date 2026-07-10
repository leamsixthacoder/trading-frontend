import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={18}
      height={18}
      aria-hidden="true"
      {...props}
    />
  )
}

export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1" />
    </Icon>
  )
}

export function PortfolioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 2.5v7.5h7.5A7.5 7.5 0 1 1 10 2.5Z" />
      <path d="M12.5 2.9A7.5 7.5 0 0 1 17.1 7.5H12.5Z" />
    </Icon>
  )
}

export function FundedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 2.5 16.5 5v4.2c0 4-2.7 6.9-6.5 8.3-3.8-1.4-6.5-4.3-6.5-8.3V5Z" />
    </Icon>
  )
}

export function LiveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m11 2-7.5 9.5H10L9 18l7.5-9.5H10Z" />
    </Icon>
  )
}

export function StrategiesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7.5 2.5h5M8 2.5v4.7L3.8 15a1.5 1.5 0 0 0 1.3 2.2h9.8a1.5 1.5 0 0 0 1.3-2.2L12 7.2V2.5" />
    </Icon>
  )
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="4" width="15" height="13.5" rx="1.5" />
      <path d="M2.5 8h15M6.5 2v4M13.5 2v4" />
    </Icon>
  )
}

export function WellnessIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10 17.3s-6.8-4.1-6.8-9.1a3.9 3.9 0 0 1 6.8-2.6 3.9 3.9 0 0 1 6.8 2.6c0 5-6.8 9.1-6.8 9.1Z" />
    </Icon>
  )
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props} width={14} height={14}>
      <path d="m5 7.5 5 5 5-5" />
    </Icon>
  )
}

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
    </Icon>
  )
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
    </Icon>
  )
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5a6.8 6.8 0 1 0 8.8 8.8Z" />
    </Icon>
  )
}

export function GroupsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="7" cy="7.5" r="3" />
      <circle cx="14" cy="12.5" r="3" />
      <path d="M4.5 16.5c0-1.9 1.5-3.3 3.3-3.3M11.7 9.7c1 .5 1.8 1.5 1.8 2.8" />
    </Icon>
  )
}

export function PlansIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="4" y="3.5" width="12" height="14" rx="1.5" />
      <path d="M7.5 2.5h5a1 1 0 0 1 1 1v1.5h-7V3.5a1 1 0 0 1 1-1Z" />
      <path d="m7 10.5 1.8 1.8L13 8.5" />
    </Icon>
  )
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </Icon>
  )
}
