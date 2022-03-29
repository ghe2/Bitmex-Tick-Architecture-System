const puppeteer = require("puppeteer");
const { URL } = require("url");

(async () => {
    let browser;

    try {
        browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            executablePath: process.env["PDF_CHROME_PATH"], // "/usr/bin/google-chrome",
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();

        const dashUrl = process.argv[2]; // here we have all parameters
        const filePath = process.argv[3];
        const theme = process.argv[4];
        const token = process.argv[5];

        const url = new URL(dashUrl);

        const documentWidth = parseInt(url.searchParams.get("documentWidth"), 10);
        const documentHeight = parseInt(url.searchParams.get("documentHeight"), 10) + 21;
        const standardWidth = url.searchParams.get("width");
        const divideinpages = false;
        const printFilters = url.searchParams.get("printfilters") === "0" ? false : true;
        const createScreenshot = false;

        const width = standardWidth === "standard" ? 1920 : documentWidth;
        const height = divideinpages ? 1080 : documentHeight;
        const hasToken = token !== undefined;
        const hasUserPass = hasToken && token.indexOf(":") !== -1;
        if (hasToken && !hasUserPass) {
            await page.setCookie({
                name: "deltaToken",
                value: token,
                domain: url.hostname,
            });
        }

        //this only affects the theme when the dashboard style property "Theme Switchable" is true
        //see onDocumentChanged() for details
        await page.setCookie({
            name: "dashboard-viewer-theme",
            value: theme || "kx-light",
            domain: url.hostname,
        });

        // best resolution
        page.setViewport({
            width: width, // 1620,
            height: height, // 1000
        });

        // screen media (css)
        await page.emulateMediaType("screen");

        // go to page
        const theUrl = url.origin + url.pathname + url.hash + url.search;

        await page.goto(
            // viewstate has to be after hash in order for it to work in appRouter
            theUrl,
            { waitUntil: "networkidle2" },
        );

        // apply pdf class (style is in QuickView/css/main.scss body.pdf)
        await page.evaluate(() => {
            document.body.classList.add("pdf");
        });

        // login
        if (hasUserPass) {
            await page.evaluate(p => {
                document.querySelector(".username").value = p[0];
                document.querySelector(".password").value = p[1];
                document.querySelector(".login-btn").click();
            }, token.split(":"));
        }

        await page.waitForTimeout(3000);

        // get windows obj handle
        const aWindowHandle = await page.evaluateHandle(() => Promise.resolve(window));

        // force resize
        const resultHandle1 = await page.evaluateHandle(
            window => window.resizeHandler(),
            aWindowHandle,
        );
        await resultHandle1.dispose();

        // run start pdf function
        const resultHandle2 = await page.evaluateHandle(
            window => window.startPdfCreation(),
            aWindowHandle,
        );
        await resultHandle2.dispose();

        // force resize
        const resultHandle3 = await page.evaluateHandle(
            window => window.resizeHandler(),
            aWindowHandle,
        );
        await resultHandle3.dispose();

        if (printFilters) {
            // append viewstate to body
            await page.evaluate(text => {
                const filtersDiv = document.createElement("div");
                filtersDiv.className = "pdf-filters-info";
                filtersDiv.innerText = text;
                document.body.appendChild(filtersDiv);
            }, url.searchParams.get("viewstate"));
        }

        // pause
        await page.waitForTimeout(3000);

        // create pdf or capture screenshot:
        if (createScreenshot) {
            await page.screenshot({
                path: filePath.split(".pdf")[0] + ".png",
                fullPage: true,
                printBackground: true,
            });
        } else {
            if (divideinpages) {
                await page.pdf({
                    path: filePath,
                    format: "A4",
                    //   width: width,
                    //   height: height,
                    //   fullPage: true,
                    printBackground: true,
                });
            } else {
                await page.pdf({
                    path: filePath,
                    width: width, // 1620,
                    height: height, // 1000,
                    printBackground: true,
                });
            }
        }

        // await browser.close();
    } catch (ex) {
        console.log(ex);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    // done
})();
