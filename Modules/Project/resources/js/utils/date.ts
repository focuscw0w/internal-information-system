import dayjs from "dayjs";

export function formatDate(dateString: string | null) {
    return dateString ? dayjs(dateString).format("DD.MM.YYYY") : "-";
}
