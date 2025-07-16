from datetime import datetime, timedelta


def parse_relative_date(period):
    """Convert relative periods like 'last month' to date ranges"""
    today = datetime.today()

    if period == "last_month":
        first_day = (today.replace(day=1) - timedelta(days=1)).replace(day=1)
        last_day = today.replace(day=1) - timedelta(days=1)
        return first_day.strftime("%Y-%m-%d"), last_day.strftime("%Y-%m-%d")

    elif period == "this_month":
        first_day = today.replace(day=1)
        last_day = (today.replace(day=28) + timedelta(days=4)
                    ).replace(day=1) - timedelta(days=1)
        return first_day.strftime("%Y-%m-%d"), last_day.strftime("%Y-%m-%d")

    elif period == "last_30_days":
        start_date = today - timedelta(days=30)
        return start_date.strftime("%Y-%m-%d"), today.strftime("%Y-%m-%d")

    return None, None
