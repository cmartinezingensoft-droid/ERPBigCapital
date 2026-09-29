import { Transformer } from '@/modules/Transformer/Transformer';

export class GetApiKeysTransformer extends Transformer {
  public includeAttributes = (): string[] => {
    return ['token'];
  };

  public excludeAttributes = (): string[] => {
    return ['tenantId'];
  };

  public token(apiKey) {
    return apiKey.keyPrefix ? `${apiKey.keyPrefix}...` : '';
  }
}
