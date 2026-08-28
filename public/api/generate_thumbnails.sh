#!/bin/bash
# Real Video Frame Snapshot & Hover Preview Generator
# Runs natively in bash on Hostinger server

TOKEN="${DISCORD_BOT_TOKEN:-YOUR_DISCORD_BOT_TOKEN}"
WEB_ROOT="/home/u948854164/domains/sekolahnakal.so791.com/public_html"
POSTER_DIR="$WEB_ROOT/uploads/posters"
PREVIEW_DIR="$WEB_ROOT/uploads/previews"
MOVIES_FILE="$WEB_ROOT/api/data/movies.json"
FFMPEG="/home/u948854164/bin/ffmpeg"

mkdir -p "$POSTER_DIR" "$PREVIEW_DIR"
chmod 777 "$POSTER_DIR" "$PREVIEW_DIR"

if [ ! -f "$MOVIES_FILE" ]; then
    echo "movies.json not found"
    exit 1
fi

echo "Extracting items from movies.json..."
# Export items as lines: id|discordMsgId|discordChannelId|title
php -r '
$m = json_decode(file_get_contents("'"$MOVIES_FILE"'"), true) ?: [];
foreach ($m as $item) {
    $id = $item["id"] ?? "";
    $msgId = $item["discordMsgId"] ?? "";
    $chanId = $item["discordChannelId"] ?? "";
    $title = preg_replace("/[^a-zA-Z0-9_-]/", "_", $item["title"] ?? "");
    if ($msgId && $chanId) {
        echo "{$id}|{$msgId}|{$chanId}|{$title}\n";
    }
}
' > /tmp/discord_items.txt

TOTAL=$(wc -l < /tmp/discord_items.txt)
echo "Total Discord items to process: $TOTAL"
COUNT=0

while IFS="|" read -r id msgId chanId title; do
    COUNT=$((COUNT + 1))
    POSTER_FILE="$POSTER_DIR/poster_${msgId}.jpg"
    PREVIEW_FILE="$PREVIEW_DIR/preview_${msgId}.mp4"
    
    if [ -f "$POSTER_FILE" ] && [ -s "$POSTER_FILE" ]; then
        echo "[$COUNT/$TOTAL] Already exists: $title"
        continue
    fi
    
    echo "[$COUNT/$TOTAL] Processing: $title (Msg: $msgId)..."
    
    # 1. Fetch fresh message attachment URL from Discord API
    MSG_JSON=$(curl -s -H "Authorization: Bot $TOKEN" -H "User-Agent: SekolahNakalBot/1.0" "https://discord.com/api/v10/channels/$chanId/messages/$msgId")
    
    VIDEO_URL=$(echo "$MSG_JSON" | php -r '
    $d = json_decode(file_get_contents("php://stdin"), true);
    if (!empty($d["attachments"])) {
        foreach ($d["attachments"] as $att) {
            $fn = strtolower($att["filename"] ?? "");
            if (preg_match("/\.(mp4|mov|mkv|webm|m4v)$/i", $fn) || str_starts_with($att["content_type"] ?? "", "video/")) {
                echo $att["url"] ?? "";
                exit;
            }
        }
    }
    ')
    
    if [ -z "$VIDEO_URL" ]; then
        echo "  -> No video attachment URL found."
        continue
    fi
    
    # 2. Download video to temporary file
    TMP_VID="/tmp/vid_${msgId}.mp4"
    curl -s -L "$VIDEO_URL" -o "$TMP_VID"
    
    if [ ! -s "$TMP_VID" ]; then
        echo "  -> Failed to download video file."
        rm -f "$TMP_VID"
        continue
    fi
    
    # 3. Extract real video frame snapshot at 1s using ffmpeg
    $FFMPEG -threads 1 -i "$TMP_VID" -ss 00:00:01 -vframes 1 -threads 1 -y "$POSTER_FILE" > /dev/null 2>&1
    
    # 4. Extract 3-second animated preview clip
    $FFMPEG -threads 1 -ss 00:00:01 -i "$TMP_VID" -t 3 -vf "scale=480:-2" -c:v libx264 -crf 28 -an -threads 1 -y "$PREVIEW_FILE" > /dev/null 2>&1
    
    # Copy to public_html mirror
    cp -f "$POSTER_FILE" "/home/u948854164/public_html/uploads/posters/poster_${msgId}.jpg" 2>/dev/null
    cp -f "$PREVIEW_FILE" "/home/u948854164/public_html/uploads/previews/preview_${msgId}.mp4" 2>/dev/null
    
    rm -f "$TMP_VID"
    
    if [ -s "$POSTER_FILE" ]; then
        echo "  -> Snapshot SUCCESS! ($(ls -lh "$POSTER_FILE" | awk '{print $5}'))"
    else
        echo "  -> Snapshot extraction failed."
    fi
done < /tmp/discord_items.txt

echo "Updating movies.json database with generated poster & preview URLs..."
php -r '
$moviesFile = "'"$MOVIES_FILE"'";
$posterDir = "'"$POSTER_DIR"'";
$previewDir = "'"$PREVIEW_DIR"'";
$movies = json_decode(file_get_contents($moviesFile), true) ?: [];
$up = 0;
foreach ($movies as &$m) {
    $msgId = $m["discordMsgId"] ?? ($m["id"] ?? "");
    $p = $posterDir . "/poster_" . $msgId . ".jpg";
    $v = $previewDir . "/preview_" . $msgId . ".mp4";
    if (file_exists($p) && filesize($p) > 500) {
        $m["posterUrl"] = "/uploads/posters/poster_" . $msgId . ".jpg";
        $m["backdropUrl"] = "/uploads/posters/poster_" . $msgId . ".jpg";
        $up++;
    }
    if (file_exists($v) && filesize($v) > 500) {
        $m["previewUrl"] = "/uploads/previews/preview_" . $msgId . ".mp4";
    }
}
file_put_contents($moviesFile, json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
file_put_contents("/home/u948854164/public_html/api/data/movies.json", json_encode($movies, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "Successfully updated {$up} movies in movies.json!\n";
'

rm -f /tmp/discord_items.txt
echo "All done!"
