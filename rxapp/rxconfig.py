import reflex as rx

config = rx.Config(
    app_name="rxapp",
    plugins=[
        rx.plugins.SitemapPlugin(),
        rx.plugins.RadixThemesPlugin(theme=rx.theme(appearance="dark")),
    ],
)
