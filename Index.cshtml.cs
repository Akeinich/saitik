using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Text.Json.Serialization;

namespace CasinoSimulator.Pages;

public class IndexModel : PageModel
{
    private const int StartingBalance = 10_000;
    private const int SingleCost = 100;
    private const int TenCost = 900;
    private const int MineReward = 50;
    private const int GiftReward = 500;
    private const string BalanceKey = "gacha.balance";
    private const string MinedKey = "gacha.mined";
    private const string LastMineKey = "gacha.lastMine";
    private const string LastGiftKey = "gacha.lastGift";

    // Ключи для системы Pity
    private const string PityKey = "gacha.pity";
    private const string GuaranteedKey = "gacha.guaranteed";

    // Пул персонажей
    private const string EventFiveStar = "🧙‍♂️ Великий Маг"; // Ивентовый
    private static readonly string[] StandardFiveStars = { "👑 Король Артур", "🐉 Дракон Владыка", "🧝‍♀️ Верховная Жрица" };

    private static readonly string[] FourStarItems = { "🧙‍♂️ Архимаг", "🦁 Грифон", "🛡️ Паладин", "🏹 Эльфийский снайпер", "🧜‍♀️ Сирена", "⚔️ Мастер клинка", "🦉 Вестник Ночи" };
    private static readonly string[] ThreeStarItems = { "🧪 Зелье маны", "📜 Свиток", "💎 Осколок", "🪙 Золотая монета", "🗡️ Кинжал", "🍞 Паёк", "🪵 Древесина" };

    public void OnGet() { _ = GetBalance(); }

    public IActionResult OnGetBalance()
    {
        return new JsonResult(new
        {
            balance = GetBalance(),
            mined = HttpContext.Session.GetInt32(MinedKey) ?? 0,
            pity = HttpContext.Session.GetInt32(PityKey) ?? 0,
            guaranteed = HttpContext.Session.GetBool(GuaranteedKey) ?? false
        });
    }

    public IActionResult OnPostReset()
    {
        SetBalance(StartingBalance);
        HttpContext.Session.SetInt32(MinedKey, 0);
        HttpContext.Session.Remove(LastMineKey);
        HttpContext.Session.Remove(LastGiftKey);
        HttpContext.Session.Remove(PityKey);
        HttpContext.Session.Remove(GuaranteedKey);
        return new JsonResult(new { balance = StartingBalance, mined = 0 });
    }

    public IActionResult OnPostMine()
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var lastMineStr = HttpContext.Session.GetString(LastMineKey);
        var lastMine = string.IsNullOrEmpty(lastMineStr) ? 0 : long.Parse(lastMineStr);

        if (now - lastMine < 180)
            return BadRequest(new { error = "Источник магии еще восстанавливается." });

        var balance = GetBalance();
        balance += MineReward;
        SetBalance(balance);

        HttpContext.Session.SetInt32(MinedKey, (HttpContext.Session.GetInt32(MinedKey) ?? 0) + MineReward);
        HttpContext.Session.SetString(LastMineKey, now.ToString());

        return new JsonResult(new { balance, mined = HttpContext.Session.GetInt32(MinedKey) });
    }

    public IActionResult OnPostClaimGift()
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var lastGiftStr = HttpContext.Session.GetString(LastGiftKey);
        var lastGift = string.IsNullOrEmpty(lastGiftStr) ? 0 : long.Parse(lastGiftStr);

        if (now - lastGift < 300000)
            return BadRequest(new { error = "Дух ещё собирается с силами." });

        var balance = GetBalance();
        balance += GiftReward;
        SetBalance(balance);
        HttpContext.Session.SetString(LastGiftKey, now.ToString());

        return new JsonResult(new { balance });
    }

    public IActionResult OnPostGacha([FromBody] GachaRequest? request)
    {
        if (request is null || (request.Count != 1 && request.Count != 10))
            return BadRequest(new { error = "Только x1 или x10." });

        var cost = request.Count == 1 ? SingleCost : TenCost;
        var balance = GetBalance();
        if (balance < cost)
            return BadRequest(new { error = "Недостаточно средств." });

        balance -= cost;
        SetBalance(balance);

        var results = new List<GachaResult>(request.Count);

        int pity = HttpContext.Session.GetInt32(PityKey) ?? 0;
        bool isGuaranteed = HttpContext.Session.GetBool(GuaranteedKey) ?? false;

        for (var i = 0; i < request.Count; i++)
        {
            // 1. Математика Soft Pity
            double fiveStarChance = 0.006; // 0.6% база
            if (pity >= 74)
            {
                double increase = (pity - 73) * 0.06;
                fiveStarChance += increase;
            }

            // 2. Ролл на 5★
            bool isFiveStar = (pity >= 89) || (Random.Shared.NextDouble() < fiveStarChance);

            if (isFiveStar)
            {
                pity = 0;
                string characterName;

                // 3. Система 50/50
                if (isGuaranteed || Random.Shared.Next(0, 2) == 0)
                {
                    characterName = EventFiveStar;
                    isGuaranteed = false; // Выиграли, сбрасываем
                }
                else
                {
                    characterName = StandardFiveStars[Random.Shared.Next(StandardFiveStars.Length)];
                    isGuaranteed = true; // Проиграли, следующий будет ивентовым
                }

                results.Add(new GachaResult(5, characterName));
            }
            else
            {
                pity++;
                double fourStarChance = 0.051;
                if (Random.Shared.NextDouble() < fourStarChance)
                    results.Add(new GachaResult(4, FourStarItems[Random.Shared.Next(FourStarItems.Length)]));
                else
                    results.Add(new GachaResult(3, ThreeStarItems[Random.Shared.Next(ThreeStarItems.Length)]));
            }
        }

        HttpContext.Session.SetInt32(PityKey, pity);
        HttpContext.Session.SetBool(GuaranteedKey, isGuaranteed);

        return new JsonResult(new { results, balance, cost });
    }

    private int GetBalance()
    {
        var balance = HttpContext.Session.GetInt32(BalanceKey);
        if (balance.HasValue && balance.Value >= 0) return balance.Value;
        SetBalance(StartingBalance);
        return StartingBalance;
    }

    private void SetBalance(int value) => HttpContext.Session.SetInt32(BalanceKey, Math.Max(0, value));

    public sealed record GachaResult([property: JsonPropertyName("stars")] int Stars, [property: JsonPropertyName("name")] string Name);
    public sealed class GachaRequest { public int Count { get; set; } }
}

public static class SessionExtensions
{
    public static void SetBool(this ISession session, string key, bool value)
    {
        session.SetString(key, value ? "true" : "false");
    }

    public static bool? GetBool(this ISession session, string key)
    {
        var value = session.GetString(key);
        return value == null ? null : value == "true";
    }
}