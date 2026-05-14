export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-7 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                C
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-sm font-semibold leading-tight">
                    Cogitator
                </span>
                <span className="truncate text-[10px] leading-tight text-muted-foreground">
                    Internal Information System
                </span>
            </div>
        </>
    );
}
