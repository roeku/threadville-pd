import React from 'react';

interface WindowErrorBoundaryProps {
    appName: string;
    children: React.ReactNode;
}

interface WindowErrorBoundaryState {
    hasError: boolean;
}

export class WindowErrorBoundary extends React.Component<WindowErrorBoundaryProps, WindowErrorBoundaryState> {
    state: WindowErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): WindowErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error(`[OS] App crashed: ${this.props.appName}`, error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full bg-slate-950 text-emerald-300 flex items-center justify-center">
                    <div className="text-center text-xs">
                        <div className="text-emerald-500 font-bold mb-2">APP CRASHED</div>
                        <div className="text-slate-400">{this.props.appName}</div>
                        <div className="text-slate-500 mt-2">Close and reopen the window.</div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
