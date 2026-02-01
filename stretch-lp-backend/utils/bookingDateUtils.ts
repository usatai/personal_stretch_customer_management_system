/**
 * 現在の日時文字列と、変更したいパーツ・値を受け取り、新しいISO文字列を返す
 */
export const calculateNewDateString = (
    currentDateStr: string, 
    part: string, 
    newValue: number | string
): string => {
    // 1. Dateオブジェクト生成
    const newStart = new Date(currentDateStr);
    const numValue = Number(newValue);

    // 2. 指定されたパーツを更新
    if (part === 'year') {
        newStart.setFullYear(numValue);
    } else if (part === 'month') {
        newStart.setMonth(numValue - 1);
    } else if (part === 'day') {
        newStart.setDate(numValue);
    } else if (part === 'time' && typeof newValue === 'string') {
        const [hours, minutes] = newValue.split(':').map(Number);
        newStart.setHours(hours, minutes, 0, 0);
    }

    // 3. 文字列フォーマット (YYYY-MM-DDTHH:mm:00)
    const year = newStart.getFullYear();
    const month = String(newStart.getMonth() + 1).padStart(2, '0');
    const day = String(newStart.getDate()).padStart(2, '0');
    const hour = String(newStart.getHours()).padStart(2, '0');
    const minute = String(newStart.getMinutes()).padStart(2, '0');
    const second = '00';

    return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
};