import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Java 17 single-file sample. No dependencies. */
public class LtxApiClient {
    private static final Pattern ID = Pattern.compile("\"job_id\"\\s*:\\s*\"([0-9a-f]{32})\"");
    private static final Pattern STATUS = Pattern.compile("\"status\"\\s*:\\s*\"([a-z]+)\"");

    static String field(Pattern pattern, String json) {
        Matcher m = pattern.matcher(json);
        if (!m.find()) throw new IllegalStateException("返回值缺少字段：" + json);
        return m.group(1);
    }

    static String jsonEscape(String s) {
        StringBuilder b = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                default -> {
                    if (c < 32) b.append(String.format("\\u%04x", (int)c));
                    else b.append(c);
                }
            }
        }
        return b.toString();
    }

    public static void main(String[] args) throws Exception {
        String key = System.getenv("LTX_API_KEY");
        if (key == null || key.length() < 24) throw new IllegalArgumentException("缺少 LTX_API_KEY 环境变量");
        String prompt = args.length > 0 ? args[0] : "A paper boat drifting across a calm lake";
        String base = "http://127.0.0.1:18080/v1/video/jobs";
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        String body = "{\"prompt\":\"" + jsonEscape(prompt)
                + "\",\"width\":512,\"height\":320,\"frames\":25,\"frame_rate\":24}";
        HttpRequest request = HttpRequest.newBuilder(URI.create(base))
                .header("X-API-Key", key).header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20)).POST(HttpRequest.BodyPublishers.ofString(body)).build();
        HttpResponse<String> created = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (created.statusCode() != 202) throw new IllegalStateException("任务创建失败：" + created.body());
        String id = field(ID, created.body());
        System.out.println("创建任务：" + id);
        long stopAt = System.nanoTime() + Duration.ofHours(2).toNanos();
        while (System.nanoTime() < stopAt) {
            HttpRequest get = HttpRequest.newBuilder(URI.create(base + "/" + id))
                    .header("X-API-Key", key).timeout(Duration.ofSeconds(20)).GET().build();
            HttpResponse<String> status = client.send(get, HttpResponse.BodyHandlers.ofString());
            if (status.statusCode() != 200) throw new IllegalStateException("查询失败：" + status.body());
            String value = field(STATUS, status.body());
            System.out.println("状态：" + value);
            if ("failed".equals(value) || "canceled".equals(value))
                throw new IllegalStateException("生成失败：" + status.body());
            if ("succeeded".equals(value)) {
                Path folder = Path.of(System.getProperty("user.dir"), "outputs");
                Files.createDirectories(folder);
                Path output = folder.resolve("java-" + id + ".mp4");
                HttpRequest download = HttpRequest.newBuilder(URI.create(base + "/" + id + "/result"))
                        .header("X-API-Key", key).timeout(Duration.ofMinutes(3)).GET().build();
                HttpResponse<Path> result = client.send(download, HttpResponse.BodyHandlers.ofFile(output));
                if (result.statusCode() != 200) {
                    Files.deleteIfExists(output);
                    throw new IllegalStateException("视频下载失败 HTTP " + result.statusCode());
                }
                System.out.println("生成成功，视频保存为：" + output);
                return;
            }
            Thread.sleep(2000);
        }
        throw new IllegalStateException("客户端等待超时；任务可能仍在生成，请根据 job_id 查询");
    }
}
