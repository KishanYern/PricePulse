import React, { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
} from "chart.js";
import { format } from "date-fns";
import 'chartjs-adapter-date-fns';

// Types
import type { ChartOptions } from "chart.js";
import type { TimeSeriesChartProps, TimeUnit } from "../types/Chart";

// Register the necessary components for Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
    data,
}) => {
    const [timeUnit, setTimeUnit] = useState<TimeUnit>("day");

    const chartData = useMemo(() => {
        if (!data || data.length === 0) {
            return { labels: [], datasets: [] };
        }

        const aggregatedData: { [key: string]: number[] } = {};
        data.forEach(({ timestamp, price }) => {
            let key: string;
            const date = new Date(timestamp);
            if (timeUnit === "day") key = format(date, "yyyy-MM-dd");
            else if (timeUnit === "month") key = format(date, "yyyy-MM");
            else key = format(date, "yyyy");
            if (!aggregatedData[key]) aggregatedData[key] = [];
            aggregatedData[key].push(price);
        });

        const labels = Object.keys(aggregatedData).sort();
        const averagedPrices = labels.map((label) => {
            const prices = aggregatedData[label];
            const sum = prices.reduce((a, b) => a + b, 0);
            return sum / prices.length;
        });

        return {
            labels,
            datasets: [
                {
                    label: "Average Price",
                    data: averagedPrices,
                    borderColor: "#8B5CF6", // purple color
                    backgroundColor: "#8B5CF6",
                    tension: 0.1,
                    pointRadius: averagedPrices.length < 50 ? 4 : 2, // Larger points for less data
                },
            ],
        };
    }, [data, timeUnit]);

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" as const },
            title: {
                display: true,
                text: `Price History`,
                font: { size: 16 },
            },
        },
        scales: {
            x: {
                type: "time",
                time: {
                    unit: timeUnit,
                    tooltipFormat: "MMM dd, yyyy",
                },
                title: { display: true, text: "Date" },
            },
            y: {
                title: { display: true, text: "Price (USD)" },
                beginAtZero: false,
            },
        },
    };

    return (
        <div className="w-full h-full p-4">
            <div className="btn-group grid grid-cols-3 mb-4">
                <button
                    onClick={() => setTimeUnit("day")}
                    className={`btn ${timeUnit === "day" ? "btn-active" : ""}`}
                >
                    Day
                </button>
                <button
                    onClick={() => setTimeUnit("month")}
                    className={`btn ${
                        timeUnit === "month" ? "btn-active" : ""
                    }`}
                >
                    Month
                </button>
                <button
                    onClick={() => setTimeUnit("year")}
                    className={`btn ${timeUnit === "year" ? "btn-active" : ""}`}
                >
                    Year
                </button>
            </div>
            <div className="relative h-64 md:h-80">
                <Line options={options} data={chartData} />
            </div>
        </div>
    );
};

export default TimeSeriesChart;
