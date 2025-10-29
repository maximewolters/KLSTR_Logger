// src/components/DeviceList.tsx
import { useSelector } from "react-redux";
export default function DeviceList() {
  const devices = useSelector((s: any) => Object.values(s.devices.byId));
  return (
    <div className="p-2 w-64 border-r">
      <h3 className="font-semibold mb-2">Devices</h3>
      <ul className="space-y-1">
        {devices
          .sort((a: any, b: any) => a.id.localeCompare(b.id))
          .map((d: any) => (
            <li
              key={d.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{d.id}</span>
              <span
                className={
                  d.status === "running"
                    ? "text-amber-600"
                    : d.status === "online"
                    ? "text-green-600"
                    : d.status === "idle"
                    ? "text-sky-600"
                    : d.status === "error"
                    ? "text-red-600"
                    : "text-gray-400"
                }
              >
                {d.status}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
