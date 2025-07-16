import { Link } from "react-router-dom";
import pageNotFoundImage from "../imgs/404.png";
import fullLogo from "../imgs/full-logo.png";

const PageNotFound = () => {
    return (
        <section className="h-cover relative p-10 flex flex-col items-center gap-20 text-center">
            <img src={pageNotFoundImage} className="select-none border-2 border-grey w-72 aspect-[2/1] object-cover rounded" />
            <h1 className="text-4xl font-gelasio leading-7">Page not found</h1>
            <p className="text-dark-grey text-xl leading-7 -mt-8">The page you are looking for has been moved or deleted. <br />Head back to the <Link to="/" className="text-black underline">home page</Link></p>
            <div className="mt-auto">
                <Link to="/" className="text-2xl font-bold text-[#185d4e] shrink-0">
                    IslamicStories
                </Link>
                <p className="mt-5 text-dark-grey">Read motivating stories about Islam</p>
            </div>
        </section>
    );
}

export default PageNotFound;