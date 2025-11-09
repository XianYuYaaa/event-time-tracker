use tauri::command;

// ============================================================================
// 颜色生成 Command（预留功能）
// ============================================================================

#[allow(dead_code)]
#[command]
pub fn generate_random_color() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    
    // 生成适中的随机颜色 (HSL)
    // 避免太浅（lightness太高）或太深（lightness太低）
    let hue = rng.gen_range(0..360);
    let saturation = rng.gen_range(50..80);  // 饱和度适中
    let lightness = rng.gen_range(40..65);   // 亮度适中，避免极端值
    
    // 转换为 RGB
    let (r, g, b) = hsl_to_rgb(hue as f32 / 360.0, saturation as f32 / 100.0, lightness as f32 / 100.0);
    
    format!("#{:02X}{:02X}{:02X}", r, g, b)
}

// HSL 转 RGB
#[allow(dead_code)]
fn hsl_to_rgb(h: f32, s: f32, l: f32) -> (u8, u8, u8) {
    let c = (1.0 - (2.0 * l - 1.0).abs()) * s;
    let x = c * (1.0 - ((h * 6.0) % 2.0 - 1.0).abs());
    let m = l - c / 2.0;
    
    let (r, g, b) = if h < 1.0 / 6.0 {
        (c, x, 0.0)
    } else if h < 2.0 / 6.0 {
        (x, c, 0.0)
    } else if h < 3.0 / 6.0 {
        (0.0, c, x)
    } else if h < 4.0 / 6.0 {
        (0.0, x, c)
    } else if h < 5.0 / 6.0 {
        (x, 0.0, c)
    } else {
        (c, 0.0, x)
    };
    
    (
        ((r + m) * 255.0) as u8,
        ((g + m) * 255.0) as u8,
        ((b + m) * 255.0) as u8,
    )
}
