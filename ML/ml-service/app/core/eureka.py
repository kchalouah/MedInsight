import py_eureka_client.eureka_client as eureka_client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

async def register_with_eureka():
    try:
        await eureka_client.init_async(
            eureka_server=settings.EUREKA_SERVER_URL,
            app_name=settings.APP_NAME,
            instance_port=settings.INSTANCE_PORT,
            instance_host=settings.INSTANCE_HOST
        )
        logger.info(f"Successfully registered {settings.APP_NAME} with Eureka")
    except Exception as e:
        logger.error(f"Failed to register with Eureka: {e}")

async def unregister_from_eureka():
    try:
        await eureka_client.stop_async()
        logger.info(f"Successfully unregistered {settings.APP_NAME} from Eureka")
    except Exception as e:
        logger.error(f"Failed to unregister from Eureka: {e}")
